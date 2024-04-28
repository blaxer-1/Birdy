require('dotenv').config();
let express = require('express');
let app = express();
let cors = require('cors');
const path = require('path');
const Utils = require("./src/utils.js");
const api = require('./src/api/api.js');
let session = require("express-session");
let database = require("./src/mongodb/mongo.js");

Utils.log(`Base directory: ${path.normalize(path.dirname(__dirname))}`);  

//--------------------------MIDDLE-WARE--------------------------//
app.use(cors({
   origin: Utils.MAIN_SITE_ORIGIN, 
   credentials: true,            //access-control-allow-credentials:true
}));

app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true,
}))
//--------------------------MIDDLE-WARE--------------------------//


//--------------------------LISTENING--------------------------//
app.listen(Utils.PORT, (err) => {
	if (err) Utils.log(err);
	Utils.log("Server LISTENING on port", Utils.PORT);
})
//--------------------------LISTENING--------------------------//


//--------------------------DB--------------------------//
database.main().catch(Utils.log).then((birdy) => {
	app.use('/api', api.default(birdy));
})
//--------------------------DB--------------------------//

//--------------------------WEBSOCKET--------------------------//
require("./src/websocket/wsserver.js");
//--------------------------WEBSOCKET--------------------------//

//App is now loaded
Utils.log(path.basename(__filename)+" loaded");