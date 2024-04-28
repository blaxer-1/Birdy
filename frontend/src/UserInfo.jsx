import React from 'react';
import Swal from 'sweetalert2';
import { default as API, API_URL} from './api';
import { Avatar } from "@mui/material";
import { toast } from "react-toastify";
import $ from 'jquery';
import Utils from './Utils';
import websocket from './websocket';
import DoneGif from './img/done.gif';
import { CircularProgressbarWithChildren  } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';


class UserInfo extends React.Component {

   constructor(props) {
      super();

      let targetId = props.isMyProfile ? props.userDetails.userId : props.userViewDetails.userId

      this.state = {
         currentProfilInfosId: targetId,

         avatarSrc: `${API_URL}/users/${targetId}/photo?v=${Math.random()}`,
         progressBarDone: false,
         progressBarValue: 0,

         nbAbonnements: 0,
         nbMessagesEnvoyes: 0,
         nbAbonnes: 0,
         nbMessagesLiked: 0,
      }

      this.handleChangeProfilImg = this.handleChangeProfilImg.bind(this);
      this.handleChangePassword = this.handleChangePassword.bind(this);

      this.setPercent = this.setPercent.bind(this);
   }

   componentDidMount() {
      //Fetch Stats
      API.get("/users/"+this.state.currentProfilInfosId+"/stats", {})
      .then((res) => {
         this.setState({
            nbAbonnements: res.data.userStats.nbAbonnements,
            nbMessagesEnvoyes: res.data.userStats.nbMessagesEnvoyes,
            nbAbonnes: res.data.userStats.nbAbonnes,
            nbMessagesLiked: res.data.userStats.nbMessagesLiked,
         })
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

   setPercent(percent) {
      this.setState({
         progressBarValue: percent,
      })
   }

   handleChangeProfilImg(e) {
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


      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept=".gif,.png,.jpeg,.jpg";
      fileInput.name="profileImage";

      fileInput.onchange = (e) => { 
         const formData = new FormData();
         formData.append('profileImage', fileInput.files[0]);

         const onUploadProgress = (event) => {
            const percentage = Math.round((100 * event.loaded) / event.total);
            console.log("Upload percentage: "+percentage+"%");

            this.setPercent(percentage);
         };


         API.post("/users/photo", formData, {
            headers: {
               'Content-Type': 'multipart/form-data'
            },
            onUploadProgress,
         })
         .then((res) => {
            toast.success("Votre photo de profil a bien été modifié", {
               position: "top-left",
               autoClose: 5000,
               hideProgressBar: false,
               closeOnClick: true,
               pauseOnHover: true,
               draggable: false,
               progress: undefined,
               theme: "light",
            });

            //Set user profile avatar
            this.setState({
               avatarSrc: `${API_URL}/users/${this.props.userDetails.userId}/photo?v=${Math.random()}`
            })

            this.setState({
               progressBarDone: true
            })

            setTimeout(() => {
               this.setState({
                  progressBarDone: false,
                  progressBarValue: 0
               })
            }, 3000)

            //Send event to other users that me changed my profile
            websocket.send(JSON.stringify({ 
               owner: this.props.userDetails.userId,
               eventName: "refreshUsersProfilePictures" 
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

      fileInput.click();
   }

   async handleChangePassword(e) {
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

      let oldPassword = undefined;
      let newPassword = undefined;
      let isConfirmed = false;
      try {
         let result = await Swal.fire({
            title: 'Réinitialiser mot de passe',
            html: `
               <form>
                  <div id="password_place">
                     <input name="password" spellCheck={false} type="password" autoComplete="current-password" class="reset_password_input" id="swal-input1" placeholder=" " />
                     <div id="cut_password_input_reset1"></div>
                     <label id="placeholder_password_input_reset" htmlFor="swal_input1">Ancien mot de passe</label>
                  </div>

                  <br />

                  <div id="password_place">               
                     <input autoComplete="current-password" placeholder=" " spellCheck={false} type="password" class="reset_password_input" name="password" id="swal-input2" />
                     <div id="cut_password_input_reset2"></div>
                     <label id="placeholder_password_input_reset" htmlFor="swal_input2">Nouveau mot de passe</label>
                  </div>
               <form />
            `,
            preConfirm: function () {
               return new Promise(function (resolve) {
                  resolve([
                    $('#swal-input1').val(),
                    $('#swal-input2').val()
                  ])
               })
            }
         });

         isConfirmed = result.isConfirmed;
         if (result && result.isConfirmed && result.value) {
            oldPassword = result.value[0];
            newPassword = result.value[1];
         }
      } catch (err) {
         toast.error(err, {
            position: "top-left",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
            theme: "light",
         });
         console.error(err);
      }

      if (!isConfirmed)
         return;

      if (oldPassword === undefined || newPassword === undefined) {
         toast.error("Votre ancien/nouveau mot de passe n'a pas été défini", {
            position: "top-left",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
            theme: "light",
         });
         return;
      }

      if (!Utils.isPasswordValid(newPassword)) {
         Swal.fire({
           title: 'Erreur !',
           text: "Le nouveau mot de passe n'est pas assez sécurisé (8 caractères alphanumérique, caractères spéciaux (!,%,&,@,#,$,^,*,?,_,~))",
           icon: 'error',
           confirmButtonText: 'OK'
         })
         return;
      }

      API.patch("/users", {
         oldPassword: oldPassword,
         newPassword: newPassword,
      })
      .then((res) => {
         toast.success("Votre mot de passe a bien été modifié", {
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


   render() {
      let userDetails = this.props.isMyProfile ? this.props.userDetails : this.props.userViewDetails;

      return (
         <div id="profile_user_info">
            <div className="user-info">
               <div className="info_avatar">
                  <Avatar sx={{ width: 80, height: 80 }} src={this.state.avatarSrc} />
               </div>
               <div className="info info_left border-left">
                  <span className="label">Login / Prénom Nom</span>
                  <span className="value">{userDetails.login} / {(userDetails.firstname) + " " + (userDetails.lastname)}</span>
               </div>
               <div className="info">
                  <span className="label">Messages envoyés</span>
                  <span className="value">{this.state.nbMessagesEnvoyes}</span>
               </div>
               <div className="info">
                  <span className="label">Messages Aimés</span>
                  <span className="value">{this.state.nbMessagesLiked}</span>
               </div>
               <div className="info">
                  <span className="label">Abonnés</span>
                  <span className="value">{this.state.nbAbonnes}</span>
               </div>
               <div className="info">
                  <span className="label">Abonnements</span>
                  <span className="value">{this.state.nbAbonnements}</span>
               </div>
               <div className="info">
                  <span className="label">Date d'inscription</span>
                  <span className="value">{new Date(userDetails.creationDate).toLocaleString()}</span>
               </div>
               {
                  this.props.isMyProfile && (
                     <React.Fragment>
                        <div className="info no-border-right">
                           <button className="custom-button user_interactions_buttons profil_button" onClick={this.handleChangeProfilImg}>Changer photo de profile</button>
                           <button className="custom-button user_interactions_buttons profil_button" onClick={this.handleChangePassword}>Changer mot de passe</button>
                        </div>
                        <div className="info no-border-right" style={{ width: 64, height: 64 }}>
                           <CircularProgressbarWithChildren id="progress_bar_upload_circular" value={this.state.progressBarValue}>
                           {
                              this.state.progressBarDone ? (
                                 <img style={{ width: 40 }} src={DoneGif} alt="upload_done" />
                              ) : (
                                 <strong>{`${this.state.progressBarValue}%`}</strong>
                              )
                           }
                           </CircularProgressbarWithChildren>
                        </div>
                     </React.Fragment>
                  )
               }
            </div>
         </div>
      )
   }
}

export default UserInfo;