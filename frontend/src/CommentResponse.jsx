import React from 'react';
import Swal from 'sweetalert2';
import $ from 'jquery';
import { Avatar } from "@mui/material";
import { default as API, API_URL} from './api';
import { toast } from "react-toastify";
import websocket from './websocket';
import Fade from '@mui/material/Fade';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';



class CommentResponse extends React.Component {

   constructor(props) {
      super()

      this.state = {
         avatarSrc: `${API_URL}/users/${props.authorId}/photo?v=${Math.random()}`,
         likesCounterClass: "animation-counter-initial",

         popoverOpen: false,
         popoverElement: null,
      }

      this.handleAddUser = this.handleAddUser.bind(this);
      this.handleDeleteMessage = this.handleDeleteMessage.bind(this);
      this.handleLikeReplyMessage = this.handleLikeReplyMessage.bind(this);
      this.viewProfile = this.viewProfile.bind(this);

      this.handlePopoverClose = this.handlePopoverClose.bind(this);
      this.handlePopoverOpen = this.handlePopoverOpen.bind(this);

      this.websocketHandleChange = this.websocketHandleChange.bind(this);
   }

   //-------------------WEBSOCKET-------------------//
   async websocketHandleChange(event) {
      let data = JSON.parse(event.data);
      console.log("WebSocket | [message] Data received from server: " + JSON.stringify(data));

      if (data.eventName === "refreshUsersProfilePictures") {
         this.setState({
            avatarSrc: `${API_URL}/users/${this.props.authorId}/photo?v=${Math.random()}`,
         })
         return;
      }

      if (data.eventName === "refreshMessagesLikesReply") {
         if (this.props.originalMessageId === data.eventParams.originalMessageId && this.props.id === data.eventParams.messageId) {
            this.setState({ likesCounterClass: 'animation-counter-goLeft'});

            this.props.fetchMessages()

            await new Promise(r => setTimeout(r, 100));

            // 3. New number waits down  
            setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-waitRight'}), 100);
            // 4. New number stays in the middle
            setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-initial'}), 200);

            return;
         }
      }
   }
   //-------------------WEBSOCKET-------------------//

   componentDidMount() {
      websocket.addEventListener("message", this.websocketHandleChange);
   }

   componentWillUnmount() {
      websocket.removeEventListener("message", this.websocketHandleChange);
   }

   handleAddUser(e) {
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

      $("#add_user_icon_reply"+this.props.id).addClass("rotating-infinite");
      $("#add_user_icon_reply"+this.props.id).html("autorenew");

      API.post("/users/"+this.props.authorId+"/follow")
      .then((res) => {
         toast.success("Vous suivez désormais @"+this.props.user, {
            position: "top-left",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
            theme: "light",
         });

         this.props.fetchUserDetails();

         $("#add_user_icon_reply"+this.props.id).removeClass("rotating-infinite");
         $("#add_user_icon_reply"+this.props.id).html("done");
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

   async handleDeleteMessage(e) {
      if (!this.props.isConnected) {
         Swal.fire({
           title: 'Erreur !',
           text: "Vous n'êtes pas connecté",
           icon: 'error',
           confirmButtonText: 'OK'
         })
         return;
      }

      //API Call
      API.delete("/messages/"+this.props.originalMessageId+"/reply/"+this.props.id)
      .then((res) => {
         toast.success("Votre message a été supprimé", {
            position: "top-left",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
            theme: "light",
         });

         this.props.fetchMessages();
         
         websocket.send(JSON.stringify({
            owner: this.props.userDetails.userId, 
            eventName: "refreshMessages" 
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

   async handleLikeReplyMessage(e) {
      if (!this.props.isConnected) {
         Swal.fire({
           title: 'Erreur !',
           text: "Vous n'êtes pas connecté",
           icon: 'error',
           confirmButtonText: 'OK'
         })
         return;
      }

      this.setState({ likesCounterClass: 'animation-counter-goLeft'});
      await new Promise(r => setTimeout(r, 100));

      let spanIcon = "#like_icon_reply_"+this.props.id;

      if (!this.props.canReply) {
         if (this.props.likedByMe) {
            $(spanIcon).html("favorite_border");

            API.delete("/messages/"+this.props.originalMessageId+"/reply/"+this.props.id+"/like")
            .then((res) => {
               toast.info("Vous retiré votre like", {
                  position: "top-left",
                  autoClose: 5000,
                  hideProgressBar: false,
                  closeOnClick: true,
                  pauseOnHover: true,
                  draggable: false,
                  progress: undefined,
                  theme: "light",
               });

               $(spanIcon).removeClass("heartbeat");

               // 3. New number waits down  
               setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-waitRight'}), 100);
               // 4. New number stays in the middle
               setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-initial'}), 200);
               

               //Send event to other users that me changed my profile
               websocket.send(JSON.stringify({
                  owner: this.props.userDetails.userId,
                  eventName: "refreshMessagesLikesReply",
                  eventParams: {
                     originalMessageId: this.props.originalMessageId,
                     messageId: this.props.id
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

               $(spanIcon).removeClass("heartbeat");

               // 3. New number waits down  
               setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-waitRight'}), 100);
               // 4. New number stays in the middle
               setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-initial'}), 200);

               console.error(error);
            });

            return;
         }

         $(spanIcon).addClass("heartbeat");
         $(spanIcon).html("favorite");

         setTimeout(() => {
            $(spanIcon).removeClass("heartbeat");
         }, 2000);

         //API Call
         API.post("/messages/"+this.props.originalMessageId+"/reply/"+this.props.id+"/like")
         .then((res) => {
            toast.success("Message liké", {
               position: "top-left",
               autoClose: 5000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: false,
               progress: undefined,
               theme: "light",
            });
         
            // 3. New number waits down  
            setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-waitRight'}), 100);
            // 4. New number stays in the middle
            setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-initial'}), 200);

            //Send event to other users that me changed my profile
            websocket.send(JSON.stringify({
               owner: this.props.userDetails.userId,
               eventName: "refreshMessagesLikesReply",
               eventParams: {
                  originalMessageId: this.props.originalMessageId,
                  messageId: this.props.id
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

            // 3. New number waits down  
            setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-waitRight'}), 100);
            // 4. New number stays in the middle
            setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-initial'}), 200);

            console.error(error);
         });
      }
   }

   viewProfile(e) {
      if (!this.props.isConnected) {
         Swal.fire({
           title: 'Erreur !',
           text: "Vous n'êtes pas connecté",
           icon: 'error',
           confirmButtonText: 'OK'
         })
         return;
      }

      this.props.setUserProfile(this.props.authorId);
   }

   handlePopoverOpen(e) {
      this.setState({ 
         popoverOpen: true,
         popoverElement: e.target,
      })
   };

   handlePopoverClose() {
      this.setState({ 
         popoverOpen: false,
         popoverElement: null
      })
   };

   render() {
      let date = new Date(this.props.date);
      let isoDate = date.toISOString();
      let formattedDate = date.getHours() + ":" + date.getMinutes() + " · " + date.getDate() + " " + date.toLocaleString('fr-FR', { month: 'long' }) + " " + date.getFullYear();
        
      return (
         <React.Fragment>
            <Popover
               id="profile-submessage-mouse-over-popover"
               sx={{
                  pointerEvents: 'none',
                  color: "lightblue",
               }}
               anchorEl={this.state.popoverElement}
               anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'left',
               }}
               open={this.state.popoverOpen}
               onClose={this.handlePopoverClose}
               disableRestoreFocus
            >
              <Typography sx={{ p: 0.5 }}>Voir le profil de @<u>{this.props.user}</u></Typography>
            </Popover>

            <Fade in={true} timeout={500}>
               <div className="comment">
                  <div className="message_content">
                     <div className="avatar_username">
                        <Avatar src={this.state.avatarSrc} sx={{
                           marginRight: '5px',
                        }}/>
                        <span className="user">@{this.props.user}</span> 
                     </div>

                     <p className="comment_text">{this.props.text}</p>
                     <span className="date">
                        <time dateTime={isoDate}>{formattedDate}</time>
                     </span>
                  </div>
                  <div className="message_buttons">
                     {
                        (this.props.authorId !== this.props.targetProfileId && this.props.authorId !== this.props.userDetails.userId) && (
                           <div className="btn-container">
                              <button 
                                 id="view_profile_button" 
                                 className="btn btn-view-profile" 
                                 onClick={this.viewProfile} 
                                 tabIndex={0}
                                 aria-owns={this.state.popoverOpen ? 'profile-submessage-mouse-over-popover' : undefined}
                                 aria-haspopup="true"
                                 onMouseEnter={this.handlePopoverOpen}
                                 onMouseLeave={this.handlePopoverClose}
                              >
                                 <span className="view_profile material-icons">search</span>
                              </button>
                           </div>
                        )
                     }

                     <div className="like_message_container btn-container additional-number">
                        <button id="like_message_button" className="btn btn-like" onClick={this.handleLikeReplyMessage} tabIndex={0}>
                           <span className="like material-icons" id={"like_icon_reply_"+this.props.id}>
                           {
                              this.props.likedByMe ? "favorite" : "favorite_border"
                           }</span>
                        </button>
                        <span className={"num_likes "+this.state.likesCounterClass} id={"like_num_reply_"+this.props.id}>{this.props.likes}</span>
                     </div>

                     {
                        this.props.canDeleteMessage && (
                           <div className="btn-container">
                              <button id="delete_message" className="btn btn-delete" onClick={this.handleDeleteMessage} tabIndex={0}>
                                 <span className="delete material-symbols-outlined">delete</span>
                              </button>
                           </div>
                        )
                     }

                     {
                        this.props.canFollowAuthor && (
                           <div className="btn-container">
                              <button id="add_author" className="btn btn-add" onClick={this.handleAddUser} tabIndex={0}>
                                 <span id={"add_user_icon_reply"+this.props.id} className="add material-symbols-outlined">add</span>
                              </button>
                           </div>
                        )
                     }
                  </div>
               </div>
            </Fade>
         </React.Fragment>
      )
   }

}

export default CommentResponse;