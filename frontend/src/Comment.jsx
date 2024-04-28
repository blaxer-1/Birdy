import React from 'react';
import Swal from 'sweetalert2';
import $ from 'jquery';
import { default as API, API_URL} from './api';
import { toast } from "react-toastify";
import { Avatar } from "@mui/material";
import websocket from './websocket';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Fade from '@mui/material/Fade';
import Popover from '@mui/material/Popover';
import Typography from '@mui/material/Typography';
import NewCommentReply from "./NewCommentReply";
import CommentResponse from "./CommentResponse";


class Comment extends React.Component {

   constructor(props) {
      super()

      this.state = {
         avatarSrc: `${API_URL}/users/${props.authorId}/photo?v=${Math.random()}`,
         likesCounterClass: "animation-counter-initial",

         repliesModalOpened: false,
         repliesCounterClass: "animation-counter-initial",

         popoverType: "profil",
         popoverOpen: false,
         popoverElement: null,
      }

      this.handleAddUser = this.handleAddUser.bind(this);
      this.handleDeleteMessage = this.handleDeleteMessage.bind(this);
      this.handleLikeMessage = this.handleLikeMessage.bind(this);
      this.handleShowReplies = this.handleShowReplies.bind(this);
      this.viewProfile = this.viewProfile.bind(this);

      this.handlePopoverClose = this.handlePopoverClose.bind(this);
      this.handlePopoverOpen = this.handlePopoverOpen.bind(this);

      this.websocketEventHandler = this.websocketEventHandler.bind(this);
   }


   async websocketEventHandler(event) {
      let data = JSON.parse(event.data);
      console.log("WebSocket | [message] Data received from server: " + JSON.stringify(data));

      if (data.eventName === "refreshUsersProfilePictures") {
         this.setState({
            avatarSrc: `${API_URL}/users/${this.props.authorId}/photo?v=${Math.random()}`,
         })
         return;
      }

      if (data.eventName === "refreshMessagesLikes" && data.eventParams.messageId === this.props.id) {
         this.setState({ likesCounterClass: 'animation-counter-goLeft'});

         this.props.fetchMessages();

         await new Promise(r => setTimeout(r, 100));

         // 3. New number waits down  
         setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-waitRight'}), 100);
         // 4. New number stays in the middle
         setTimeout(() => this.setState({ likesCounterClass: 'animation-counter-initial'}), 200);

         return;
      }
   }


   //-------------------WEBSOCKET-------------------//
   componentDidMount() {
      websocket.addEventListener("message", this.websocketEventHandler);
   }

   componentWillUnmount() {
      websocket.removeEventListener("message", this.websocketEventHandler);
   }
   //-------------------WEBSOCKET-------------------//

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

      $("#add_user_icon"+this.props.id).addClass("rotating-infinite");
      $("#add_user_icon"+this.props.id).html("autorenew");

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

         $("#add_user_icon"+this.props.id).removeClass("rotating-infinite");
         $("#add_user_icon"+this.props.id).html("done");
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

   handleDeleteMessage(e) {
      if (!this.props.isConnected) {
         Swal.fire({
           title: 'Erreur !',
           text: "Vous n'êtes pas connecté",
           icon: 'error',
           confirmButtonText: 'OK'
         })
         return;
      }

      //Fix si l'utilisateur clique a coté de la poubelle
      if (e.target.id === "delete_message") {
         e.target = e.target.querySelector("span");
      }

      $(e.target).addClass("rotating-infinite");
      $(e.target).html("autorenew");

      //API Call
      API.delete("/messages/"+this.props.id)
      .then((res) => {
         toast.success("Votre message a bien été supprimé", {
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

   async handleLikeMessage(e) {
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

      let spanIcon = "#like_icon_"+this.props.id;

      //Déjà like donc retrait
      if (this.props.likedByMe) {
         $(spanIcon).html("favorite_border");

         API.delete("/messages/"+this.props.id+"/like")
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
               eventName: "refreshMessagesLikes",
               eventParams: {
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
      API.post("/messages/"+this.props.id+"/like")
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
            eventName: "refreshMessagesLikes",
            eventParams: {
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

   handleShowReplies(e) {
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

      this.props.fetchMessages();
      this.setState({ repliesModalOpened: true });
   }

   handlePopoverOpen(e, type) {
      this.setState({ 
         popoverType: type,
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
      let messagesReplied = this.props.replies.reverse().map((message) => {
         let nbLikes = message.likes.length;
         let isLikedByMe = message.likes.find((uId) => uId === this.props.userDetails.userId) !== undefined ? true : false;

         return (
            <CommentResponse
               setUserProfile={this.props.setUserProfile}
               targetProfileId={this.props.targetProfileId}
               userViewDetails={this.props.userViewDetails}
               likedByMe={isLikedByMe}
               likes={nbLikes}
               fetchMessages={this.props.fetchMessages}
               userDetails={this.props.userDetails}
               fetchUserDetails={this.props.fetchUserDetails} 
               key={message.id}
               originalMessageId={this.props.id}
               id={message.id}
               isConnected={this.props.isConnected} 
               user={message.author}
               authorId={message.authorId} 
               date={message.date} 
               text={message.text}
               canFollowAuthor = {this.props.canFollowAuthor} 
               canDeleteMessage = {message.authorId === this.props.userDetails.userId} 
            />
         )
      })

      let date = new Date(this.props.date);
      let isoDate = date.toISOString();
      let formattedDate = date.getHours() + ":" + date.getMinutes() + " · " + date.getDate() + " " + date.toLocaleString('fr-FR', { month: 'long' }) + " " + date.getFullYear();

      return (
         <React.Fragment>
            <Fade in={true} timeout={1000}>
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
                                 aria-owns={this.state.popoverOpen ? 'profile-mouse-over-popover' : undefined}
                                 aria-haspopup="true"
                                 onMouseEnter={(e) => {
                                    this.handlePopoverOpen(e, "profil")
                                 }}
                                 onMouseLeave={this.handlePopoverClose}
                              >
                                 <span className="view_profile material-icons">search</span>
                              </button>
                           </div>
                        )
                     }

                     <div className="replies_message_container btn-container additional-number">
                        <button id="replies_message_button" className="btn btn-replies" onClick={this.handleShowReplies} tabIndex={0}>
                           <span className="reply material-icons" id={"reply_icon_"+this.props.id}>chat</span>
                        </button>
                        <span className={this.state.repliesCounterClass} id={"replies_num_"+this.props.id}>{this.props.nbReplies}</span>
                     </div>

                     <div className="like_message_container btn-container additional-number">
                        <button id="like_message_button" className="btn btn-like" onClick={this.handleLikeMessage} tabIndex={0}>
                           <span className="like material-icons" id={"like_icon_"+this.props.id}>
                           {
                              this.props.likedByMe ? "favorite" : "favorite_border"
                           }</span>
                        </button>
                        <span className={"num_likes "+this.state.likesCounterClass} id={"like_num_"+this.props.id}>{this.props.likes}</span>
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
                              <button 
                                 id="add_author" 
                                 className="btn btn-add" 
                                 onClick={this.handleAddUser} 
                                 tabIndex={0}
                                 aria-owns={this.state.popoverOpen ? 'profile-mouse-over-popover' : undefined}
                                 aria-haspopup="true"
                                 onMouseEnter={(e) => {
                                    this.handlePopoverOpen(e, "follow")
                                 }}
                                 onMouseLeave={this.handlePopoverClose}
                              >
                                 <span id={"add_user_icon"+this.props.id} className="add material-symbols-outlined">add</span>
                              </button>
                           </div>
                        )
                     }
                  </div>
               </div>
            </Fade>

            <Popover
               id="profile-mouse-over-popover"
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
            {  
               this.state.popoverType === "profil" ? (
                  <Typography sx={{ p: 0.5 }}>Voir le profil de @<u>{this.props.user}</u></Typography>
               ) : (
                  <Typography sx={{ p: 0.5 }}>Suivre @<u>{this.props.user}</u></Typography>
               )
            }
            </Popover>

            <Modal
               open={this.state.repliesModalOpened}
               onClose={() => {
                  this.setState({ repliesModalOpened: false })
               }}
               aria-labelledby="modal-modal-reply-message"
               aria-describedby="modal-modal-reply-to-a-message"
            >
               <Fade in={this.state.repliesModalOpened} timeout={500}>
                  <Box sx={{
                     position: "absolute",
                     top: "10%",
                     left: "50%",
                     transform: "translate(-50%, -10%)",
                     border: "2px solid black",
                     borderRadius: '10px',
                     maxHeight: "90vh",
                     minWidth: "50vw",
                     maxWidth: "50vw",
                     display: "flex",
                     flexDirection: 'column',
                     padding: "0",
                     margin: "0",
                     backgroundColor: "lightblue",
                     overflow: 'auto',
                  }}>
                     <div className="reply-message-header">
                        <div className="align-left">
                           <button id="close_reply_message_button" className="btn btn-close" onClick={(e) => {
                              e.preventDefault();
                              this.setState({ repliesModalOpened: false });
                           }} tabIndex={0}>
                              <span className="close material-icons">close</span>
                           </button>
                        </div>
                     </div>

                     <div className="comment comment-reply">
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

                           <div className="reply-respond-to">En réponse à <u>@{this.props.user}</u></div>
                        </div>

                        <div className="message_buttons">
                           <div className="like_message_container btn-container additional-number">
                              <button id="like_message_button" className="btn btn-like" onClick={this.handleLikeMessage} tabIndex={0}>
                                 <span className="like material-icons" id={"like_icon_"+this.props.id}>
                                 {
                                    this.props.likedByMe ? "favorite" : "favorite_border"
                                 }</span>
                              </button>
                              <span className={"num_likes "+this.state.likesCounterClass} id={"like_num_"+this.props.id}>{this.props.likes}</span>
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
                                    <button 
                                       id="add_author" 
                                       className="btn btn-add" 
                                       onClick={this.handleAddUser} 
                                       tabIndex={0}
                                       aria-owns={this.state.popoverOpen ? 'profile-mouse-over-popover' : undefined}
                                       aria-haspopup="true"
                                       onMouseEnter={(e) => {
                                          this.handlePopoverOpen(e, "follow")
                                       }}
                                       onMouseLeave={this.handlePopoverClose}
                                    >
                                       <span id={"add_user_icon"+this.props.id} className="add material-symbols-outlined">add</span>
                                    </button>
                                 </div>
                              )
                           }
                        </div>
                     </div>

                     <div className="user-input-response">
                        <Avatar src={`${API_URL}/users/${this.props.userDetails.userId}/photo?v=${Math.random()}`} sx={{
                           height: "80px",
                           width: "80px",
                           marginLeft: "2.5%",
                        }}/>

                        <NewCommentReply author={this.props.user} messageId={this.props.id} fetchUserDetails={this.props.fetchUserDetails} fetchMessages={this.props.fetchMessages} isConnected={this.props.isConnected} userDetails={this.props.userDetails}/>
                     </div>

                     {messagesReplied}
                  </Box>
               </Fade>
            </Modal>
         </React.Fragment>
      )
   }

}

export default Comment;