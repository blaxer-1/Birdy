import React from 'react';
import $ from 'jquery';
import Swal from 'sweetalert2';
import API from './api';
import Utils from './Utils';
import { toast } from 'react-toastify';


class Login extends React.Component {

   constructor(props) {
      super();

      this.isPasswordShow = false;

      this.handleLoginUser = this.handleLoginUser.bind(this);
      this.changePasswordState = this.changePasswordState.bind(this);
   }

   changePasswordState(e) {
      this.isPasswordShow = !this.isPasswordShow;

      let type = this.isPasswordShow ? "text" : "password"
      let htmlText = this.isPasswordShow ? "visibility" : "visibility_off"
      $("#login_input_password").attr("type", type);
      $("#show_password").html(htmlText);
   }

   handleLoginUser(e) {
      e.preventDefault();

      let login = $("#input_login_user").val();
      let password = $("#login_input_password").val();

      if (!(Utils.isInputValid(login))) {
         Swal.fire({
           title: 'Erreur !',
           text: "Votre login doit contenir uniquement des caractères alphanumériques et/ou '-', '_' sans espace",
           icon: 'error',
           confirmButtonText: 'OK'
         });
         return;
      }

      //API Call
      API.post("/login", {
         login: login,
         password: password,
      })
      .then((res) => {
         this.props.setUserDetails("userId", res.data.user.userId);
         this.props.setUserDetails("firstname", res.data.user.firstname);
         this.props.setUserDetails("lastname", res.data.user.lastname);
         this.props.setUserDetails("login", login);
         this.props.setUserDetails("creationDate", res.data.user.creationDate);
         this.props.setUserDetails("followings", res.data.user.followings);

         this.props.setConnected(true);
         this.props.setMainPage();
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
      return (
         <div id="main_login_page">
            <h1 id="open_session_login">Ouvrir une session</h1>
            <form id="login_grid">
               <div id="login_place">
                  <span className="form-icon material-symbols-outlined">login</span>
                  <input placeholder=" " autoComplete="username" spellCheck={false} type="text" name="login" id="input_login_user" />
                  <div id="cut_login"></div>
                  <label id="placeholder_login_input" htmlFor="input_login_user">Login</label>
               </div>

               <div id="password_place">
                  <span className="form-icon material-symbols-outlined">lock</span>
                  
                  <input autoComplete="current-password" placeholder=" " spellCheck={false} type="password" name="password" id="login_input_password" />
                  <div id="cut_password"></div>
                  <label id="placeholder_password_input" htmlFor="login_input_password">Mot de passe</label>
               
                  <span id="show_password" className="password-icon material-symbols-outlined" onClick={this.changePasswordState}>visibility_off</span>
               </div>

               <button className="login_buttons" id="login_connexion_button" onClick={
                  this.handleLoginUser
               } tabIndex={0}>Connexion</button>

               <button className="login_buttons" id="login_cancel_button" onClick={ () => {
                  this.props.cancelAction();
               }} tabIndex={0}>Annuler</button>
            </form>
         </div>
      )
   }
}

export default Login;