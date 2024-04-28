let Utils = require("../utils.js");
let init_db = require("./init.js");
const { MongoClient } = require('mongodb');

async function main(){
	// URI de connexion. À modifier si on n'est pas en local
	const client = new MongoClient(Utils.DB_URI);
	try {
		// Connexion au serveur
		await client.connect();
	
		let db = await client.db("birdy");

		//Create collections if not exists (messages & users)
		await init_db(db);

		return db;
	} catch (e) {
		// si une des promesses n'est pas réalisée
		Utils.log(e);
	}
}

exports.main = main;