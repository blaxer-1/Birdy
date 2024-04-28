class Messages {
   constructor(db) {
      this.db = db
   }

   async getNextSequence() {
      var ret = await this.db.collection("messages_counter").findOneAndUpdate(
         { _id: "messageId" },
         { $inc: { seq: 1 }},
         {
            returnDocument: 'after',
            returnNewDocument: true,
         }
      );
      return ret.value.seq;
   }

   async getNextSequenceReply(originalId) {
      originalId = parseInt(originalId)
      let messagesReplies = await this.db.collection("messages_replies_counter").find({ messageId: originalId }).toArray();

      //If doc not exist create one for this message
      if (messagesReplies.length <= 0) {
         await this.db.collection("messages_replies_counter").insertOne({
            messageId: originalId,
            seq: 0,
         });
      }


      var ret = await this.db.collection("messages_replies_counter").findOneAndUpdate(
         { messageId: originalId },
         { $inc: { seq: 1 }},
         {
            returnDocument: 'after',
            returnNewDocument: true,
         }
      );
      return ret.value.seq;
   }

   async exists(id) {
      id = parseInt(id);
      let result = await this.db.collection("messages").find({ id: id }).toArray();
      return (result.length > 0)
   }

   async getAll() {
      let result = await this.db.collection("messages").find().toArray();
      return result;
   }

   create(author, authorId, text) {
      authorId = parseInt(authorId)
      return new Promise(async (resolve, reject) => {
         let message = {
            id: await this.getNextSequence(),
            author: author,
            authorId: authorId,
            text: text,
            date: Date.now(),
            replies: [],
            likes: [],
         }

         let result = await this.db.collection("messages").insertOne(message);
         if (!result.acknowledged) {
            reject({ status: "echec", message: "Erreur interne lors de la création du message" })
            return;
         }

         resolve(message, await this.getAll());
      });
   }

   delete(messageId) {
      messageId = parseInt(messageId)
      return new Promise(async (resolve, reject) => {
         let result = await this.db.collection("messages").deleteOne(
            { id: messageId },
         );
         console.log(result)
         if (!result.acknowledged) {
            reject({ status: "echec", message: "Erreur interne lors de la suppression de réponse du message" })
            return;
         }

         //Delete also the counter for this message
         let replyResult = await this.db.collection("messages_replies_counter").deleteOne(
            { messageId: messageId },
         );
         console.log(replyResult)
         if (!replyResult.acknowledged) {
            reject({ status: "echec", message: "Erreur interne lors de la suppression de réponse du message" })
            return;
         }

         resolve(await this.getAll());
      });
   }

   like(messageId, userId) {
      messageId = parseInt(messageId)
      return new Promise(async (resolve, reject) => {
         let message = await this.db.collection("messages").find({ id: messageId }).toArray();
         if (message.length < 1) {
            reject({ status: 0, message: "Aucun message existe avec cet ID" });
            return;
         }

         message = message[0];

         if (message.likes.includes(userId)) {
            reject({ status: 0, message: "Message deja like" });
            return;
         }

         //Add like
         let result = await this.db.collection("messages").findOneAndUpdate(
            { id: messageId },
            { $push: { likes: userId } },
            {
               returnDocument: 'after',
               returnNewDocument: true
            }
         );
         if (!result.ok) {
            reject({ status: 0, message: "Erreur interne lors du like du message" })
            return;
         }

         resolve({ status: 1, message: "Le message a bien été liké" });
      });
   }

   unlike(messageId, userId) {
      messageId = parseInt(messageId)
      return new Promise(async (resolve, reject) => {
         let message = await this.db.collection("messages").find({ id: messageId }).toArray();
         if (message.length < 1) {
            reject({ status: 0, message: "Aucun message existe avec cet ID" });
            return;
         }

         message = message[0];

         if (!message.likes.includes(userId)) {
            reject({ status: 0, message: "Le message n'a pas deja été liké" });
            return;
         }

         //Add like
         let result = await this.db.collection("messages").findOneAndUpdate(
            { id: messageId },
            { $pull: { likes: userId } },
            {
               returnDocument: 'after',
               returnNewDocument: true
            }
         );
         if (!result.ok) {
            reject({ status: 0, message: "Erreur interne lors de la suppression du like du message" })
            return;
         }

         resolve({ status: 1, message: "Le message a bien été unliké" });
      });
   }

   createReplyTo(originalMessageId, author, authorId, text) {
      originalMessageId = parseInt(originalMessageId)
      authorId = parseInt(authorId)
      return new Promise(async (resolve, reject) => {
         let message = {
            id: await this.getNextSequenceReply(originalMessageId),
            author: author,
            authorId: authorId,
            text: text,
            date: Date.now(),
            likes: [],
         }

         let result = await this.db.collection("messages").updateOne(
            { id: originalMessageId },
            { $push: { replies: message } }
         );
         if (!result.acknowledged) {
            reject({ status: "echec", message: "Erreur interne lors de la création du message" })
            return;
         }

         resolve(message, await this.getAll());
      });
   }

   deleteReply(originalMessageId, replyId) {
      originalMessageId = parseInt(originalMessageId)
      replyId = parseInt(replyId)
      return new Promise(async (resolve, reject) => {
         let result = await this.db.collection("messages").updateOne(
            { id: originalMessageId },
            { $pull: { replies: { id: replyId }}}
         );
         console.log(result)
         if (!result.acknowledged) {
            reject({ status: "echec", message: "Erreur interne lors de la suppression de réponse du message" })
            return;
         }

         resolve(await this.getAll());
      });
   }


   likeReply(originalMessageId, messageId, userId) {
      originalMessageId = parseInt(originalMessageId);
      messageId = parseInt(messageId);
      return new Promise(async (resolve, reject) => {
         let message = await this.db.collection("messages").find({ id: originalMessageId }).toArray();
         if (message.length < 1) {
            reject({ status: 0, message: "Aucun message existe avec cet ID" });
            return;
         }

         message = message[0];

         let replyMessage = message.replies.find((mess) => mess.id == messageId);
         if (!replyMessage) {
            reject({ status: 0, message: "Message de réponse n'existe pas" });
            return;
         }

         if (replyMessage.likes && replyMessage.likes.includes(userId)) {
            reject({ status: 401, message: "Message de réponse deja like" })
            return;
         }

         //Add like to submessage
         let result = await this.db.collection("messages").findOneAndUpdate(
            { id: originalMessageId, "replies.id": messageId },
            { $push: { "replies.$.likes": userId }},
            {
               returnDocument: 'after',
               returnNewDocument: true
            }
         );
         if (!result.ok) {
            reject({ status: 0, message: "Erreur interne lors de la création du message" })
            return;
         }

         resolve({ status: 1, message: "Le message de réponse a bien été liké" });
      });
   }

   unlikeReply(originalMessageId, messageId, userId) {
      originalMessageId = parseInt(originalMessageId);
      messageId = parseInt(messageId);
      return new Promise(async (resolve, reject) => {
         let message = await this.db.collection("messages").find({ id: originalMessageId }).toArray();
         if (message.length < 1) {
            reject({ status: 0, message: "Aucun message existe avec cet ID" });
            return;
         }

         message = message[0];

         let replyMessage = message.replies.find((mess) => mess.id == messageId);
         if (!replyMessage) {
            reject({ status: 0, message: "Message de réponse n'existe pas" });
            return;
         }

         if (replyMessage.likes && !replyMessage.likes.includes(userId)) {
            reject({ status: 401, message: "Le message n'a pas encore été liké" })
            return;
         }

         //Add like to submessage
         let result = await this.db.collection("messages").findOneAndUpdate(
            { id: originalMessageId, "replies.id": messageId },
            { $pull: { "replies.$.likes": userId }},
            {
               returnDocument: 'after',
               returnNewDocument: true
            }
         );
         console.log(result)
         if (!result.ok) {
            reject({ status: 0, message: "Erreur interne lors de la création du message" })
            return;
         }

         resolve({ status: 1, message: "Le message de réponse a bien été unliké" });
      });
   }

   get(userid) {
      return new Promise((resolve, reject) => {
      });
   }
}

exports.default = Messages;

