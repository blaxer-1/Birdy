let Utils = require("../utils.js");

async function init_db(db) {
   try {
      await db.createCollection("users")
      Utils.log("Collection 'users' has been created !")
   } catch(e) {
      Utils.log("Collection 'users' already exists, skipping...")
   }

   try {
      await db.createCollection("users_counter")
      Utils.log("Collection 'users_counter' has been created !")
   } catch(e) {
      Utils.log("Collection 'users_counter' already exists, skipping...")
   }

   try {
      await db.collection("users_counter").insertOne({ _id: "userId", seq: 0 })
      Utils.log("Document 'userId' has been created !")
   } catch(e) {
      Utils.log("Document 'userId' already exists, skipping...")
   }

   try {
      await db.createCollection("messages")
      Utils.log("Collection 'messages' has been created !")
   } catch(e) {
      Utils.log("Collection 'messages' already exists, skipping...")
   }

   try {
      await db.createCollection("messages_counter")
      Utils.log("Collection 'messages_counter' has been created !")
   } catch(e) {
      Utils.log("Collection 'messages_counter' already exists, skipping...")
   }

   try {
      await db.collection("messages_counter").insertOne({ _id: "messageId", seq: 0 })
      Utils.log("Document 'messageId' has been created !")
   } catch(e) {
      Utils.log("Document 'messageId' already exists, skipping...")
   }


   try {
      await db.createCollection("messages_replies_counter")
      Utils.log("Collection 'messages_replies_counter' has been created !")
   } catch(e) {
      Utils.log("Collection 'messages_replies_counter' already exists, skipping...")
   }
}

module.exports = init_db;