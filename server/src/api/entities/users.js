let bcrypt = require("bcrypt");

class Users {
   constructor(db) {
      this.db = db
   }

   async getNextSequence(name) {
      var ret = await this.db.collection("users_counter").findOneAndUpdate(
         { _id: name },
         { $inc: { seq: 1 }},
         {
            returnNewDocument: true,
         }
      );
      return ret.value.seq;
   }

   async exists(login) {
      let result = await this.db.collection("users").find({ login: login }).toArray();
      return (result.length > 0);
   }

   create(login, password, lastname, firstname) {
      return new Promise(async (resolve, reject) => {
         const passwordHash = await bcrypt.hash(password, 10);
         if (!(passwordHash)) {
            reject({ status: 0, message: "Erreur:"+passwordHash })
            return;
         }

         let user = {
            userId: await this.getNextSequence("userId"),
            firstname: firstname,
            lastname: lastname, 
            login: login,
            password: passwordHash,
            creationDate: Date.now(),
            followings: [],
         }

         let result = await this.db.collection("users").insertOne(user);
         if (!result.acknowledged) {
            reject({ status: 0, message: "Erreur interne lors de la création du compte" })
            return;
         }

         //Remove password from infos
         delete user["password"];

         resolve(user);
      });
   }

   async checkPassword(login, password) {
      let result = await this.db.collection("users").find({ login: login }).project({ "_id": 0 }).toArray();
      if (result.length < 1) {
         return { status: 0, message: "Aucun compte avec ce login existe" };
      }

      let userInfos = result[0];

      let isSamePassword = await bcrypt.compare(password, userInfos.password);
      if (!(isSamePassword)) {
         return { status: 0, message: "Mot de passe invalide" };
      }

      return { status: 1, message: "Mot de passe correcte", data: userInfos };
   }

   async getAll() {
      let result = await this.db.collection("users").find().project({ "_id": 0, "userId": 1, "login": 1 }).toArray();
      return result;
   }

   get(id) {
      id = parseInt(id);
      return new Promise(async (resolve, reject) => {
         let result = await this.db.collection("users").find({ userId: id }).project({ "_id": 0, "password": 0 }).toArray();
         if (result.length <= 0) {
            reject({ status: 0, message: "Aucun compte avec cet ID existe" });
            return;
         }

         let userInfos = result[0];

         //Add abonnes infos
         userInfos.followers = [];

         let usersList = await this.db.collection("users").find().toArray();
         usersList.forEach((user) => {
            user.followings.forEach((follow) => {
               if (follow.userId == id) {
                  userInfos.followers.unshift({ login: follow.login, userId: follow.userId })
               }
            })
         })

         resolve(userInfos);
      });
   }

   getStats(id) {
      id = parseInt(id);
      return new Promise(async (resolve, reject) => {
         let result = await this.db.collection("users").find({ userId: id }).project({ "_id": 0, "password": 0 }).toArray();
         if (result.length <= 0) {
            reject({ status: 0, message: "Aucun compte avec cet ID existe" });
            return;
         }

         let userInfos = result[0];

         //Get nb message envoyes + messages liked
         let nbMessagesLiked = 0, nbMessagesEnvoyes = 0;
         let messages = await this.db.collection("messages").find().toArray();
         messages.forEach((message) => {
            if (message.authorId == id) {
               nbMessagesEnvoyes++;
            }

            if (message.likes.includes(id)) {
               nbMessagesLiked++;
            }

            if (message.replies) {
               message.replies.forEach((mess) => {
                  if (mess.authorId == id) {
                     nbMessagesEnvoyes++;
                  }

                  if (mess.likes.includes(id)) {
                     nbMessagesLiked++;
                  }
               })
            }
         })

         //Get nb abonnements
         let nbAbonnements = userInfos.followings.length;

         //Get nb abonnes
         let nbAbonnes = 0;
         let usersList = await this.db.collection("users").find().toArray();
         usersList.forEach((user) => {
            user.followings.forEach((follow) => {
               if (follow.userId == id) {
                  nbAbonnes++;
               }
            })
         })

         let userStats = {
            nbMessagesLiked: nbMessagesLiked,
            nbMessagesEnvoyes: nbMessagesEnvoyes,
            nbAbonnes: nbAbonnes,
            nbAbonnements: nbAbonnements,
            login: userInfos.login,
         }

         resolve(userStats);
      });
   }

   changePassword(userId, oldPassword, newPassword) {
      userId = parseInt(userId)
      return new Promise(async (resolve, reject) => {
         let result = await this.db.collection("users").find({ userId: userId }).toArray();
         if (result.length <= 0) {
            reject({ status: 0, message: "Aucun compte avec cet ID existe" });
            return;
         }

         let userInfos = result[0];

         //Change user password
         let passwordMatch = await bcrypt.compare(oldPassword, userInfos.password);
         if (!passwordMatch) {
            reject({ status: 0, message: "Ancien mot de passe invalide" })
            return;
         }

         const newPasswordHash = await bcrypt.hash(newPassword, 10);
         if (!(newPasswordHash)) {
            reject({ status: 0, message: "Erreur:"+newPasswordHash })
            return;
         }

         let updatedPassword = await this.db.collection("users").updateOne(
            { userId: userId },
            { $set: { password: newPasswordHash }}
         )
         if (!updatedPassword.acknowledged) {
            reject({ status: 0, message: "Erreur interne" })
            return;
         }

         resolve({ status: 1, message: "Le mot de passe a bien été changé" })
      });
   }

   follow(userId, targetId) {
      userId = parseInt(userId);
      targetId = parseInt(targetId);
      return new Promise(async (resolve, reject) => {
         let result = await this.db.collection("users").find({ userId: userId }).toArray();
         if (result.length <= 0) {
            reject({ status: 0, message: "Aucun compte avec cet ID existe" });
            return;
         }

         let userInfos = result[0];

         let isAlreadyFollowing = false;
         userInfos.followings.forEach((follow) => {
            if (follow.userId == targetId) {
               isAlreadyFollowing = true;
               return;
            }
         })
         if (isAlreadyFollowing) {
            reject({ status: 0, message: "Vous suivez déjà cette personne" });
            return;
         }

         let targetUser = await this.get(targetId);

         //Add Follow
         let followObj = await this.db.collection("users").findOneAndUpdate(
            { userId: userId },
            { $push: { followings: { login: targetUser.login, userId: targetId } } },
            {
               returnDocument: 'after',
               returnNewDocument: true
            }
         );
         if (!followObj.ok) {
            reject({ status: 0, message: "Erreur interne lors du follow" })
            return;
         }

         resolve({ status: 1, message: "Vous suivez désormais cet utilisateur" });
      });
   }

   unfollow(userId, targetId) {
      userId = parseInt(userId);
      targetId = parseInt(targetId);
      return new Promise(async (resolve, reject) => {
         let result = await this.db.collection("users").find({ userId: userId }).toArray();
         if (result.length <= 0) {
            reject({ status: 0, message: "Aucun compte avec cet ID existe" });
            return;
         }

         let userInfos = result[0];

         let isAlreadyFollowing = false;
         userInfos.followings.forEach((follow) => {
            if (follow.userId == targetId) {
               isAlreadyFollowing = true;
               return;
            }
         })
         if (!isAlreadyFollowing) {
            reject({ status: 0, message: "Vous ne suivez déjà pas cette personne" });
            return;
         }

         let targetUser = await this.get(targetId);

         //Add Follow
         let followObj = await this.db.collection("users").findOneAndUpdate(
            { userId: userId },
            { $pull: { followings: { login: targetUser.login, userId: targetId } } },
            {
               returnDocument: 'after',
               returnNewDocument: true
            }
         );
         if (!followObj.ok) {
            reject({ status: 0, message: "Erreur interne lors du unfollow" })
            return;
         }

         resolve({ status: 1, message: "Vous ne suivez plus cet utilisateur" });
      });
   }
}

exports.default = Users;

