import React from 'react';
import $ from 'jquery';
import Swal from 'sweetalert2';
import API from './api';
import Utils from './Utils';
import { toast } from "react-toastify";
import websocket from './websocket';

class NewCommentReply extends React.Component {

   constructor(props) {
      super(props);

      this.handleNewReply = this.handleNewReply.bind(this);
   }

   handleNewReply(e) {
      e.preventDefault();

      if (!this.props.isConnected) {
         Swal.fire({
           title: 'Erreur !',
           text: "Vous n'êtes pas connecté",
           icon: 'error',
           confirmButtonText: 'OK'
         })
         return;
      }


      //TODO Remove html part from this entry (Fix SCRIPT, XSS and SQL Injection etc... / Parse message)
      let finalText = $("#textarea_new_message_reply").text();

      //API Call
      API.post("/messages/"+this.props.messageId+"/reply", {
         message: finalText,
      })
      .then((res) => {
         this.props.fetchMessages();

         $("#textarea_new_message_reply").empty();
         $("#placeholder_input_message_reply").css("display", "block");
         $("#submit_button_message_reply").removeClass("active");

         websocket.send(JSON.stringify({ 
            owner: this.props.userDetails.userId,
            eventName: "refreshMessages" 
         }));

         websocket.send(JSON.stringify({ 
            owner: this.props.userDetails.userId,
            eventName: "receivedNewMessageReply",
            eventParams: {
               author: this.props.userDetails.login,
               authorMainMessage: this.props.author
            }
         }));
      })
      .catch((error) => {
         if (error && error.response && error.response.status && error.response.data && error.response.data.status && error.response.data.message) {
            toast.error(error.response.data.status+" | "+error.response.data.message, {
               position: "top-left",
               autoClose: 5000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: false,
               progress: undefined,
               theme: "light",
            });
         }
         console.error(error);
      });
   }

   //Clear style when you paste text with formatting style
   clearPasteText(element) {
      element.preventDefault();

      let pasteText = element.clipboardData.getData('text');
      let oldText = $(element.target).text();
      $(element.target).text(oldText + pasteText);   

      //Fix pour mettre le curseur a la fin du collage
      setTimeout(() => {
         const div = document.getElementById("textarea_new_message_reply");
         const range = document.createRange();
         const sel = window.getSelection();
         range.selectNodeContents(div);
         range.collapse(false);
         sel.removeAllRanges();
         sel.addRange(range);
      }, 0)
   }

   validateTextarea(element) {
      $("#placeholder_input_message_reply").css("display", "none");

      let text;
      let currentlength = element.target.innerText.length;

      let placeholder = document.getElementById("placeholder_input_message_reply");
      let counter = document.getElementById("counter_text_reply");
      let button = document.getElementById("submit_button_message_reply");
      let readonlyInput = document.getElementById("readonly_input_reply");

      if (currentlength <= 0) {
         placeholder.style.display = "block";
         button.classList.remove("active");
      } else {
         placeholder.style.display = "none";
         button.classList.add("active");
      }

      counter.innerText = Utils.maxLength - currentlength;

      if (currentlength > Utils.maxLength) {
         let overText = element.target.innerText.substr(Utils.maxLength); //extracting over texts
         overText = `<span class="highlight">${overText}</span>`; //creating new span and passing over texts
         text = element.target.innerText.substr(0, Utils.maxLength) + overText; //passing overText value in textTag variable
         readonlyInput.style.zIndex = "1";
         counter.style.color = "#e0245e";
         button.classList.remove("active");
      } else {
         readonlyInput.style.zIndex = "-1";
         counter.style.color = "#333";
      }

      readonlyInput.innerHTML = text; //replacing innerHTML of readonly div with textTag value
   }


   render() {
      return (
         <div id="new_message" className="new-reply">
            <div id="message_input_box" className="message-input-box-reply">
               <div id="message_area" className="message-reply-area">
                  <span id="placeholder_input_message_reply" className="placeholder_input_message">Votre réponse.</span>
                  <div id="textarea_new_message_reply"className="input editable" contentEditable spellCheck="false"
                     onPaste={this.clearPasteText}
                     onFocus={
                        (e) => {
                           $("#placeholder_input_message_reply").css("color","#c5ccd3");
                        }
                     } onBlur={
                        (e) => {
                           $("#placeholder_input_message_reply").css("color","#98a5b1");
                        }
                     } 
                     onKeyUp = {this.validateTextarea}
                     onKeyPress = {this.validateTextarea} 
                     onKeyDown = {this.validateTextarea} 
                     onInput = {this.validateTextarea}
                  ></div>
                  <div id="readonly_input_reply" className="input readonly" contentEditable="true" spellCheck="false"></div>
               </div>
            </div>

            <div className="message_user_interaction reply_message">
               <div id="interactions_content" className="interactions_reply">
                  <span id="counter_text_reply">{Utils.maxLength}</span>
                  <button id="submit_button_message_reply" className="button-post-message" onClick={this.handleNewReply} tabIndex={0}>Envoyer</button>
               </div>
            </div>
         </div>
      )
   }

}

export default NewCommentReply;