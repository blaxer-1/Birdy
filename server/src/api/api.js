//--------------------------REQUIREMENTS--------------------------//
let express = require('express');
let fileUpload = require("express-fileupload");
let session = require("express-session");
let bcrypt = require("bcrypt");
let fs = require("fs");
let path = require('path');
let Utils = require("../utils.js");
let Users = require("./entities/users.js");
let Messages = require("./entities/messages.js");
let { websocketSendToAll, websocketGetClients } = require("../websocket/wsserver.js");
//--------------------------REQUIREMENTS--------------------------//

const validExts = [".gif", ".png", ".jpeg", ".jpg"];


function init(db) {
	let router = express.Router();
	
	router.use(express.json());
	router.use(fileUpload());

	router.use((req, res, next) => {
		Utils.log("-------------------------")
	   Utils.log('API: method \x1b[33m'+req.method+'\x1b[0m, path \x1b[33m'+req.path+"\x1b[0m");
	   Utils.log('Body', req.body);
	   next();
	})

	//--------------------------DB CLASSES--------------------------//
	let users = new Users.default(db);
	let messages = new Messages.default(db);
	//--------------------------DB CLASSES--------------------------//

	//Middle-ware check session
	async function checkSession(req, res, next) {
		Utils.log("Check session", req.sessionID);

		if (req.session && req.session.userLogin && req.session.userId > 0) {
			Utils.log("Session:", req.sessionID, "is valid ! (userId:", req.session.userId, ", login:", req.session.userLogin,")")
			next();
			return;
		}

		Utils.log("Session:", req.sessionID, "is unknown...")
		res.status(401);
		res.send({ status: 401, message: "Vous n'êtes pas authentifié pour effectuer cette action" })
		res.end();
		return;
	}

	//--------------------------SIGNUP--------------------------//
	router.put("/users", async (req, res, next) => {
		let { firstname, lastname, login, password } = req.body;

	   if (!(Utils.isInputValid(firstname))) {
	      res.status(400);
	      res.json({ status: 400, message: "Le prénom n'est pas une entrée valide" });
	      res.end();
	      return;
	   }

	   if (!(Utils.isInputValid(lastname))) {
	      res.status(400);
	      res.json({ status: 400, message: "Le nom n'est pas une entrée valide" });
	      res.end();
	      return;
	   }

	   if (!(Utils.isInputValid(login))) {
	      res.status(400);
	      res.json({ status: 400, message: "Le login n'est pas une entrée valide" });
	      res.end();
	      return;
	   }

	   if (!(Utils.isPasswordValid(password))) {
	      res.status(400);
	      res.json({ status: 400, message: "Le mot de passe n'est pas une entrée valide" });
	      res.end();
	      return;
	   }

	   let isUserExist = await users.exists(login);
      if (isUserExist) {
         res.status(409);
         res.json({ status: 409, message: "Ce login est déjà utilisé" });
         res.end();
         return;
      }

	   //Add user to DB
	   users.create(login, password, firstname, lastname)
	   .then((user) => {
	   	//Set session params
			req.session.userId = user.userId;
			req.session.userLogin = login;

			//Callback 201
			res.status(201);
			res.json({ status: 201, message: "Vous vous êtes bien inscrit", userId: user.userId, creationDate: user.creationDate })

		   Utils.log("SignIn success from", login)

		   //Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

			res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	      res.json({ status: 500, message: err.message });
	      res.end();

	      Utils.log("Failed SignIn from", login, err.message)

	      return;
	   })
	})
	//--------------------------SIGNUP--------------------------//

	//--------------------------LOGIN--------------------------//
	router.post("/login", async (req, res, next) => {
	   let { login, password } = req.body;

	   if (!(Utils.isInputValid(login))) {
	      res.status(400);
	      res.json({ status: 400, message: "Le login n'est pas une entrée valide" });
	      res.end();
	      return;
	   }

	   if (!(Utils.isPasswordValid(password))) {
	      res.status(400);
	      res.json({ status: 400, message: "Le mot de passe n'est pas une entrée valide" });
	      res.end();
	      return;
	   }

	   //Check if this login exists
	   let isUserExist = await users.exists(login);
	   if (!isUserExist) {
	   	res.status(401)
			res.json({ status: 401, message: "Aucun compte avec ce login existe" })
			res.end();
			return;
	   }

	   //If user exists check password
	   let result = await users.checkPassword(login, password);
	   if (result.status == 0) {
	   	res.status(401)
			res.json({ status: 401, message: result.message })
			res.end();
			return;
	   }

	   let userInfos = result.data
	   
      req.session.regenerate((err) => {
	      if (err) {
            res.status(500);
            res.json({
               status: 500,
               error: err
            });
            return;
        	}

         req.session.userId = userInfos.userId;
         req.session.userLogin = userInfos.login;

         res.status(200);
			res.json({ status: 200, message: "Vous êtes désormais connecté", user: userInfos })

			Utils.log(req.session);
	   	Utils.log("Login success from", userInfos.login)

			res.end();
    	});
	})
	//--------------------------LOGIN--------------------------//

	//--------------------------LOGOUT--------------------------//
	router.post("/logout", checkSession, async (req, res, next) => {	 
		let uId = req.session.userId; 

	   req.session.destroy((err) => {
	      if (err) {
            res.status(500);
            res.json({ status: 500, error: err });
            return;
        	}

         res.status(200);
			res.json({ status: 200, message: "Vous êtes maintenant déconnecté" })

	   	Utils.log("Logout success from", uId)

			res.end();
    	});
	})
	//--------------------------LOGOUT--------------------------//

	//--------------------------MESSAGES--------------------------//
	router.post("/messages", checkSession, async (req, res, next) => {
	   let { message } = req.body;
	   if (!message) {
	   	res.status(401);
	   	res.json({ status: 401, message: "Le message ne possède aucun contenu"})
	   	res.end();
	   	return;
	   }

	   //Parse message
	   message = Utils.escapeHtml(message);
	   message = Utils.escapeJs(message);

	   //Error message too long
	   if (message.length > Utils.maxLength) {
	      res.status(401)
	      res.json({ status: 401, message: "Message trop long" })
	      res.end();
	      return;
	   }
	   
	   messages.create(req.session.userLogin, req.session.userId, message)
	   .then((message, messagesList) => {
	   	res.status(200);
		   res.json({ status: 200, message: "Vous avez bien publié votre nouveau message", messagesList: messagesList })

		   Utils.log("Received new message from", req.session.userLogin)

		   //Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

		   res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	   	res.json({ status: 500, message: err.message })

	   	Utils.log("Failed received new message from", req.session.userLogin)

	   	res.end();
	   });
	})

	router.post("/messages/:messageId/reply", checkSession, async (req, res, next) => {
	   let { messageId } = req.params;
	   let { message } = req.body;

	   if (!messageId) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucun messageId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   if (!message) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucun contenu message n'a été spécifié" })
	      res.end();
	      return;
	   }

	   //Parse message
	   message = Utils.escapeHtml(message);
	   message = Utils.escapeJs(message);

	   //Error message too long
	   if (message.length > Utils.maxLength) {
	      res.status(401)
	      res.json({ status: 401, message: "Message trop long" })
	      res.end();
	      return;
	   }
	   

	   //Find message byId
	   let isOriginalMessageExist = await messages.exists(messageId);
	   if (!isOriginalMessageExist) {
	      res.status(401)
	      res.json({ status: 401, message: "Aucun message avec cette ID existe" })
	      res.end();
	      return;
	   }

	   messages.createReplyTo(messageId, req.session.userLogin, req.session.userId, message)
	   .then((message, messagesList) => {
	   	res.status(200);
	   	res.json({ status: 200, message: "Vous avez bien publié une reponse à un message", messagesList: messagesList })

	   	Utils.log("Received new message reply from", req.session.userLogin, " for message", messageId)

	   	//Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

	   	res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	   	res.json({ status: 500, message: err.message })

	   	Utils.log("Failed received new message reply from", req.session.userLogin)

	   	res.end();
	   })
	})

	router.delete("/messages/:originalMessageId/reply/:messageId", checkSession, (req, res, next) => {
	   let { messageId, originalMessageId } = req.params;
	   if (!messageId) {
	   	res.status(400)
	      res.json({ status: 400, message: "Aucun messageId n'a été spécifié" })
	      res.end();
	      return;
	   }
	   if (!originalMessageId) {
	   	res.status(400)
	      res.json({ status: 400, message: "Aucun originalMessageId n'a été spécifié" })
	      res.end();
	      return;
	   }
	   
	   //Get message object
	   messages.deleteReply(originalMessageId, messageId)
	   .then((messagesList) => {
	   	res.status(200);
	   	res.json({ status: 200, message: "Le message de réponse a bien été supprimé", messagesList: messagesList})

	   	Utils.log("Deleted SUBmessage from", req.session.userLogin)

	   	//Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

	   	res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	   	res.json({ status: 500, message: err.message })

	   	Utils.log("Deleted SUBmessage from", req.session.userLogin)

	   	res.end();
	   });
	})

	router.get("/messages", checkSession, async (req, res, next) => {
		let messagesList = await messages.getAll();

	   res.status(200);
	   res.json({ status: 200, messages: "Vous avez récupéré la liste des messages", messagesList: messagesList })

	   Utils.log(req.session.userId, "requested to get messages")

	   res.end();
	})

	router.delete("/messages/:messageId", checkSession, (req, res, next) => {
	   let { messageId } = req.params;
	   if (!messageId) {
	   	res.status(401)
	      res.json({ status: 401, message: "Aucun messageId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   //Get message object
	   messages.delete(messageId)
	   .then((messagesList) => {
	   	res.status(200);
	   	res.json({ status: 200, message: ("Message N°"+messageId+" supprimé"), messagesList: messagesList })

	   	Utils.log("Deleted message from", req.session.userLogin, "messages size is now", messages.length)

	   	//Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

	   	res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	   	res.json({ status: 500, message: err.message })

	   	Utils.log("Deleted message from", req.session.userLogin)

	   	res.end();
	   });
	})
	//--------------------------MESSAGES--------------------------//


	//--------------------------USERS--------------------------//
	router.get("/users", checkSession, async (req, res, next) => {
	   //Get infos from user with this session.userId and check if user exist
	   users.get(req.session.userId)
	   .then((user) => {
	   	res.status(200);
		   res.json({ status: 200, message: "Vous avez récupéré vos informations de compte", user: user })

		   Utils.log(user.login, "requested to get his user details", user)

		   res.end();
	   })
	   .catch((err) => {
	   	res.status(401)
	      res.json({ status: 401, message: err.message })
	      res.end()
	   });
	})

	router.get("/users/list", checkSession, async (req, res, next) => {
	   let usersList = await users.getAll();

	   res.status(200);
	   res.json({ status: 200, message: "Vous avez récupéré les informations des utilisateurs", users: usersList })

	   Utils.log(req.session.userLogin, "requested to get all user details")

	   res.end();
	})

	router.get("/users/:userId", checkSession, (req, res, next) => {
	   let { userId } = req.params;
	   if (!userId) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucune target userId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   //Get target user info
	   users.get(userId)
	   .then((user) => {
	   	res.status(200);
	   	res.json({ status: 200, message: "Vous avez bien récupéré les informations de profil de l'utilisateur", user: user })

	   	Utils.log(req.session.userId, "requested to get", user.login, "user details", user)

	   	res.end();
	   })
	   .catch((err) => {
	   	res.status(401)
	      res.json({ status: 401, message: err.message })
	      res.end()
	   });
	})

	router.get("/users/:userId/stats", checkSession, (req, res, next) => {
	   let { userId } = req.params;
	   if (!userId) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucune target userId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   //Get target user info
	   users.getStats(userId)
	   .then((user) => {
	   	res.status(200);
	   	res.json({ status: 200, message: "Vous avez bien récupéré les stats de profil de l'utilisateur", userStats: user })

	   	Utils.log(req.session.userId, "requested to get", user.login, "user stats", user)

	   	res.end();
	   })
	   .catch((err) => {
	   	res.status(401)
	      res.json({ status: 401, message: err.message })
	      res.end()
	   });
	})


	router.patch("/users", checkSession, async (req, res, next) => {
	   let { oldPassword, newPassword } = req.body;
	   if (!oldPassword) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucun ancien mot de passe n'a été spécifié" })
	      res.end();
	      return;
	   }

	   if (!newPassword) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucun nouveau mot de passe n'a été spécifié" })
	      res.end();
	      return;
	   }

	   //Patch
	   if (!Utils.isPasswordValid(newPassword)) {
	      res.status(401)
	      res.json({ status: 401, message: "Le nouveau mot de passe n'est pas assez sécurisé (8 caractères alphanumérique, caractères spéciaux (!,%,&,@,#,$,^,*,?,_,~))" })
	      res.end();
	      return;
	   }


	   users.changePassword(req.session.userId, oldPassword, newPassword)
	   .then((result) => {
	   	if (result.status == 1) {
	   		res.status(200);
			   res.json({ status: 200, message: "Vous avez bien modifié votre mot de passe" })

			   Utils.log(req.session.userLogin, "changed his password")

			   res.end();
	   	}
	   })
	   .catch((err) => {
	   	res.status(401)
	      res.json({ status: 401, message: err.message })
	      res.end()
	   })
	})

	function deleteFilesWithName(dirPath, fileName) {
	   const files = fs.readdirSync(dirPath);
	   for (let file of files) {
	      const parsed = path.parse(file);
	      const filePath = path.join(dirPath, fileName+parsed.ext);
	      if (parsed.name === fileName) {
	         fs.unlinkSync(filePath);
	         Utils.log(`File ${filePath} has been deleted.`);
	      }
	   }
	}

	router.post("/users/photo", checkSession, async (req, res, next) => {
	   let { profileImage } = req.files;
	   if (!profileImage) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucune image n'a été envoyé" })
	      res.end();
	      return;
	   }


	   //Store photo
	   deleteFilesWithName(path.resolve(`./uploads/img/`), String(req.session.userId));

	   let fileName = req.session.userId + path.extname(profileImage.name)
	   let err = await profileImage.mv(path.resolve(`./uploads/img/${fileName}`));

	   if (err) {
	      Utils.log(err)
	      res.status(400)
	      res.json({ status: 400, error: "Erreur lors de l'upload du fichier: "+profileImage.name })
	      res.end();
	      return;
	   }

	   res.status(200);
	   res.json({ status: 200 })

	   Utils.log(req.session.userId, "uploaded a new profil picture")

	   res.end();
	})


	function fileExists(path, exts) {
	   for (let ext of exts) {
	      const filePath = path + ext;
	      if (fs.existsSync(filePath)) {
	         return [true, ext];
	      }
	   }
	   return [false, null];
	}

	router.get('/users/:userId/photo', checkSession, function(req, res){
	   let { userId } = req.params;
	   if (!userId) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucun userId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   let fileName = path.resolve(`./uploads/img/${userId}`);
	   let [isFileExist, foundExt] = fileExists(fileName, validExts);

	   let file = fileName + foundExt;
	   if (!isFileExist) {
	      file = path.resolve(`./uploads/img/0.png`);
	   }

	   res.download(file, (err) => {
	      if (err) {
	         res.status(404)
	         res.json({ status: 404, message: err.errno })
	         res.end();
	         return;
	      }
	   });
	});
	//--------------------------USERS--------------------------//


	//--------------------------LIKES--------------------------//
	router.post("/messages/:messageId/like", checkSession, (req, res, next) => {
	   let { messageId } = req.params;

	   if (!messageId) {
	   	res.status(401)
	      res.json({ status: 401, message: "Aucun messageId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   console.log(req.session.userId, "va like ", messageId)
	   messages.like(messageId, req.session.userId)
	   .then((result) => {
	   	if (result.status != 1) {
	   		res.status(500);
		   	res.json({ status: 500, message: "Erreur interne" });

		   	Utils.log("Error when unlike message: ", messageId, "from", req.session.userLogin);

		   	res.end();
	   		return;
	   	}

	   	res.status(200);
		   res.json({ status: 200, message: "Message bien liké" })

		   Utils.log(req.session.userId, "liked message", messageId)

		   //Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

		   res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	   	res.json({ status: 500, message: err.message });

	   	Utils.log("Error when like message: ", messageId, "from", req.session.userLogin);

	   	res.end();
	   });
	})


	router.delete("/messages/:messageId/like", checkSession, (req, res, next) => {
		let { messageId } = req.params;
	   if (!messageId) {
	   	res.status(401)
	      res.json({ status: 401, message: "Aucun messageId n'a été spécifié" })
	      res.end();
	      return;
	   }


	   messages.unlike(messageId, req.session.userId)
	   .then((result) => {
	   	if (result.status != 1) {
	   		res.status(500);
		   	res.json({ status: 500, message: "Erreur interne" });

		   	Utils.log("Error when unlike message: ", messageId, "from", req.session.userLogin);

		   	res.end();
	   		return;
	   	}

	   	res.status(200);
		   res.json({ status: 200, message:"Vous n'avez pas like ce message" })

		   Utils.log(req.session.userId, "unliked message", messageId)

		   //Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

		   res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	   	res.json({ status: 500, message: err.message });

	   	Utils.log("Error when unlike message: ", messageId, "from", req.session.userLogin);

	   	res.end();
	   });
	})

	router.post("/messages/:originalMessageId/reply/:messageId/like", checkSession, (req, res, next) => {
	   let { messageId, originalMessageId } = req.params;
	   if (!messageId) {
	   	res.status(401)
	      res.json({ status: 401, message: "Aucun messageId n'a été spécifié" })
	      res.end();
	      return;
	   }
	   if (!originalMessageId) {
	   	res.status(401)
	      res.json({ status: 401, message: "Aucun originalMessageId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   messages.likeReply(originalMessageId, messageId, req.session.userId)
	   .then((result) => {
	   	res.status(200);
		   res.json({ status: 200, message: "Vous avez bien liké le message de réponse"})
	 
		   Utils.log(req.session.userLogin, "liked messageId:", messageId, "from originalMessageId:", originalMessageId)

		   //Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

		   res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	   	res.json({ status: 500, message: err.message });

	   	Utils.log("Error when like messageId: ", messageId, "from originalMessageId", originalMessageId, "from user:", req.session.userLogin);

	   	res.end();
	   });
	})



	router.delete("/messages/:originalMessageId/reply/:messageId/like", checkSession, (req, res, next) => {
	   let { messageId, originalMessageId } = req.params;
	   if (!messageId) {
	   	res.status(401)
	      res.json({ status: 401, message: "Aucun messageId n'a été spécifié" })
	      res.end();
	      return;
	   }
	   if (!originalMessageId) {
	   	res.status(401)
	      res.json({ status: 401, message: "Aucun originalMessageId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   messages.unlikeReply(originalMessageId, messageId, req.session.userId)
	   .then((result) => {
	   	res.status(200);
	   	res.json({ status: 200, message: "Vous avez bien unlike le message de réponse"})

	   	Utils.log(req.session.userLogin, "unliked messageId:", messageId, "from originalMessageId:", originalMessageId)

	   	//Websocket send refresh Stats to all
		   websocketSendToAll(JSON.stringify({
		   	eventName: "refreshStats"
		   }))

	   	res.end();
	   })
	   .catch((err) => {
	   	res.status(500);
	   	res.json({ status: 500, message: err.message });

	   	Utils.log("Error when unlike messageId: ", messageId, "from originalMessageId", originalMessageId, "from user:", req.session.userLogin);

	   	res.end();
	   });
	})
	//--------------------------LIKES--------------------------//

	//--------------------------STATS--------------------------//
	router.get("/stats", async (req, res, next) => {
		let usersListLength = await db.collection("users").count();
		let messagesListLength = await db.collection("messages").count();

		let messagesLiked = await db.collection("messages").find({ likes: { $ne: [] } }).toArray();

		let nbLikes = 0;
		let messagesList = await db.collection("messages").find().toArray();
		messagesList.forEach(function(element, index) {
			nbLikes += element.likes.length

			element.replies.forEach(function(element2, index2) {
				nbLikes += element2.likes.length
			});
		});

		let nbClients = websocketGetClients().size;

		let nbViews = (await db.collection("website_views").find({ _id: "viewsId" }).toArray())[0].seq;

		let creationDate = new Date(Utils.CREATION_TIMESTAMP*1000);
		let websiteCreationDate = creationDate.getHours() + ":" + creationDate.getMinutes() + " · " + creationDate.getDate() + " " + creationDate.toLocaleString('fr-FR', { month: 'long' }) + " " + creationDate.getFullYear();


		let stats = {
			userCount: {
		      value: usersListLength,
		      label: "Nombre d'utilisateurs",
		   },
		   nbMessagesSent: {
		      value: messagesListLength,
		      label: "Nombre de messages envoyés",
		   },
		   nbMessagesLiked: {
		      value: messagesLiked.length,
		      label: "Nombre de messages aimés",
		   },
		   nbLikes: {
		      value: nbLikes,
		      label: "Nombre de J'aimes",
		   },
		   nbCli: {
		      value: nbClients,
		      label: "Nombre d'utilisateurs en ligne",
		   },
		   nbVues: {
		      value: nbViews,
		      label: "Nombre de visites du site",
		   },
		   creationDate: {
		      value: websiteCreationDate,
		      label: "Date de création",
		   }
		}

	   res.status(200);
	   res.json({ status: 200, message: "Vous avez bien récupéré les statistiques", stats: stats})

	   Utils.log("Stats requested")

	   res.end();
	})
	//--------------------------STATS--------------------------//

	//--------------------------FOLLOW--------------------------//
	router.post("/users/:userId/follow", checkSession, (req, res, next) => {
	   let { userId } = req.params;
	   if (!userId) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucune target userId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   //Get target user info
	   users.follow(req.session.userId, userId)
	   .then((_) => {
	   	res.status(200);
	   	res.json({ status: 200, message: "Vous avez bien follow l'utilisateur"})

	   	Utils.log(req.session.userLogin, "is now following", userId)

	   	res.end();
	   })
	   .catch((err) => {
	   	res.status(401)
	      res.json({ status: 401, message: err.message })
	      res.end()
	   });
	})

	router.post("/users/:userId/unfollow", checkSession, (req, res, next) => {
	   let { userId } = req.params;
	   if (!userId) {
	      res.status(400)
	      res.json({ status: 400, message: "Aucune target userId n'a été spécifié" })
	      res.end();
	      return;
	   }

	   //Get target user info
	   users.unfollow(req.session.userId, userId)
	   .then((_) => {
	   	res.status(200);
	   	res.json({ status: 200, message: "Vous avez bien unfollow l'utilisateur"})

	   	Utils.log(req.session.userLogin, "has unfollow", userId)

	   	res.end();
	   })
	   .catch((err) => {
	   	res.status(401)
	      res.json({ status: 401, message: err.message })
	      res.end()
	   });
	})
	//--------------------------FOLLOW--------------------------//


	//--------------------------404--------------------------//
	router.use((req, res, next) => {
   	res.setHeader('Content-Type', 'text/plain;charset=UTF-8');
   	res.status(404).send("Cette page n'existe pas.");
	})
	//--------------------------404--------------------------//

	return router;
}


exports.default = init;