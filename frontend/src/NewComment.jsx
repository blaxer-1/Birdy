import React from 'react';
import $ from 'jquery';
import Swal from 'sweetalert2';
import API from './api';
import Utils from './Utils';
import { toast } from "react-toastify";
import websocket from './websocket';

class NewComment extends React.Component {

   constructor(props) {
      super(props);

      this.handleNewMessage = this.handleNewMessage.bind(this);
   }

   handleNewMessage(e) {
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

      //Make buton unusable
      $("#submit_button_message").removeClass("active")

      let messageText = $("#textarea_new_message").text();

      //API Call
      API.post("/messages", {
         message: messageText
      })
      .then((res) => {
         this.props.fetchMessages();
         this.props.fetchUserDetails();

         $("#textarea_new_message").empty();
         $("#placeholder_input_message").css("display", "block");
         $("#submit_button_message").removeClass("active");

         websocket.send(JSON.stringify({ 
            owner: this.props.userDetails.userId,
            eventName: "refreshMessages" 
         }));

         websocket.send(JSON.stringify({ 
            owner: this.props.userDetails.userId,
            eventName: "receivedNewMessage",
            eventParams: {
               author: this.props.userDetails.login
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
         const div = document.getElementById("textarea_new_message");
         const range = document.createRange();
         const sel = window.getSelection();
         range.selectNodeContents(div);
         range.collapse(false);
         sel.removeAllRanges();
         sel.addRange(range);
      }, 0)
   }

   validateTextarea(element) {
      $("#placeholder_input_message").css("display", "none");

      let text;
      let currentlength = element.target.innerText.length;

      let placeholder = document.getElementById("placeholder_input_message");
      let counter = document.getElementById("counter_text");
      let button = document.getElementById("submit_button_message");
      let readonlyInput = document.getElementById("readonly_input");

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
         <div id="new_message">
            <div id="message_input_box">
               <div id="message_area">
                  <span id="placeholder_input_message" className="placeholder_input_message">Quoi de neuf ?</span>
                  <div id="textarea_new_message"className="input editable" contentEditable spellCheck="false"
                     onPaste={this.clearPasteText}
                     onFocus={
                        (e) => {
                           $("#placeholder_input_message").css("color","#c5ccd3");
                        }
                     } onBlur={
                        (e) => {
                           $("#placeholder_input_message").css("color","#98a5b1");
                        }
                     } 
                     onKeyUp = {this.validateTextarea}
                     onKeyPress = {this.validateTextarea} 
                     onKeyDown = {this.validateTextarea} 
                     onInput = {this.validateTextarea}
                  ></div>
                  <div id="readonly_input" className="input readonly" contentEditable="true" spellCheck="false"></div>
               </div>
            </div>

            <div className="message_user_interaction">
               <span id="author">
                  <span style= {{ color:"green" }}>Connecté</span> en tant que: 
                  <span style={{ color:"orange" }}> {this.props.userDetails.login}</span>
               </span>
               <div id="interactions_content">
                  <span id="counter_text">{Utils.maxLength}</span>
                  <button id="submit_button_message" className="button-post-message" onClick={this.handleNewMessage} tabIndex={0}>Envoyer</button>
               </div>
            </div>
         </div>
      )
   }

}

export default NewComment;