import React from 'react';
import $ from 'jquery';
import Swal from 'sweetalert2';
import API from './api';
import Utils from './Utils';
import { toast } from 'react-toastify';

class SignIn extends React.Component {

   constructor(props) {
      super();

      this.state = {
         passwordStrength: 0,
      }

      this.isPasswordShow = false;
      this.isConfirmPasswordShow = false;

      this.validatePasswords = this.validatePasswords.bind(this);
      this.changePasswordState = this.changePasswordState.bind(this);
      this.changeConfirmPasswordState = this.changeConfirmPasswordState.bind(this);
      this.handleCreateUser = this.handleCreateUser.bind(this);
   }

   changePasswordState() {
      this.isPasswordShow = !this.isPasswordShow;

      let type = this.isPasswordShow ? "text" : "password"
      let htmlText = this.isPasswordShow ? "visibility" : "visibility_off"
      $("#input_password_register").attr("type", type);
      $("#show_password").html(htmlText);
   }

   changeConfirmPasswordState() {
      this.isConfirmPasswordShow = !this.isConfirmPasswordShow;

      let type = this.isConfirmPasswordShow ? "text" : "password"
      let htmlText = this.isConfirmPasswordShow ? "visibility" : "visibility_off"
      $("#input_confirm_password_register").attr("type", type);
      $("#show_confirm_password").html(htmlText);
   }

   validatePasswords() {
      let strength = 0;

      let password = document.getElementById("input_password_register").value;
      let confirm_password = document.getElementById('input_confirm_password_register').value;

      let lowUpperCase = document.getElementById("low_upper_case");
      let lowUpperCaseText = document.getElementById("low_upper_case_text");

      let number = document.getElementById("numbers");
      let numberText = document.getElementById("numbers_text");

      let specialChar = document.getElementById("special_chars");
      let specialCharText = document.getElementById("special_chars_text");

      let samePasswords = document.getElementById("same_passwords");
      let samePasswordsText = document.getElementById("same_passwords_text");

      password = Utils.escapeHtml(password);
      document.getElementById("input_password_register").value = password;

      if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
         strength += 1;
         lowUpperCase.classList.remove('fa-xmark');
         lowUpperCase.classList.add('fa-check');
         lowUpperCaseText.style.color = "green";
      } else {
         lowUpperCase.classList.add('fa-xmark');
         lowUpperCase.classList.remove('fa-check');
         lowUpperCaseText.style.color = "black";
      }

      if (password.match(/([0-9])/)) {
         strength += 1;
         number.classList.remove('fa-xmark');
         number.classList.add('fa-check');
         numberText.style.color = "green";
      } else {
         number.classList.add('fa-xmark');
         number.classList.remove('fa-check');
         numberText.style.color = "black";
      }

      if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) {
         strength += 1;
         specialChar.classList.remove('fa-xmark');
         specialChar.classList.add('fa-check');
         specialCharText.style.color = "green";
      } else {
         specialChar.classList.add('fa-xmark');
         specialChar.classList.remove('fa-check');
         specialCharText.style.color = "black";
      }
      
      if (password === confirm_password && password.length >= 8) {
         strength += 1;
         samePasswords.classList.remove('fa-xmark');
         samePasswords.classList.add('fa-check');
         samePasswordsText.style.color = "green";  
      } else {
         samePasswords.classList.add('fa-xmark');
         samePasswords.classList.remove('fa-check');
         samePasswordsText.style.color = "black";   
      }

      //Change drop filter color
      switch (strength) {
         case 0: 
            $("#password_validation").css("filter", "drop-shadow(0 0 0.9rem red)");
            break;

         case 1: 
            $("#password_validation").css("filter", "drop-shadow(0 0 0.9rem red)");
            break;

         case 2: 
            $("#password_validation").css("filter", "drop-shadow(0 0 0.9rem darkorange)");
            break;

         case 3: 
            $("#password_validation").css("filter", "drop-shadow(0 0 0.9rem darkorange)");
            break;

         case 4: 
            $("#password_validation").css("filter", "drop-shadow(0 0 0.9rem green)");
            break;

         default: 
            $("#password_validation").css("filter", "drop-shadow(0 0 0.9rem black)");
            break;
      }

      this.setState({
         passwordStrength: strength
      })
   }

   handleCreateUser(e) {
      e.preventDefault();

      let firstname = $("#input_firstname_register").val();
      let lastname = $("#input_lastname_register").val();
      let login = $("#input_register").val();
      let password = $("#input_password_register").val();

      if (!(Utils.isInputValid(firstname))) {
         Swal.fire({
           title: 'Erreur !',
           text: "Votre prénom doit contenir uniquement des caractères alphanumériques et/ou '-', '_' sans espace",
           icon: 'error',
           confirmButtonText: 'OK'
         });
         return;
      }

      if (!(Utils.isInputValid(lastname))) {
         Swal.fire({
           title: 'Erreur !',
           text: "Votre nom doit contenir uniquement des caractères alphanumériques et/ou '-', '_' sans espace",
           icon: 'error',
           confirmButtonText: 'OK'
         });
         return;
      }

      if (!(Utils.isInputValid(login))) {
         Swal.fire({
           title: 'Erreur !',
           text: "Votre login doit contenir uniquement des caractères alphanumériques et/ou '-', '_' sans espace",
           icon: 'error',
           confirmButtonText: 'OK'
         });
         return;
      }

      if (this.state.passwordStrength !== 4) {
         Swal.fire({
           title: 'Erreur !',
           text: "Votre mot de passe n'est pas assez sécurisé",
           icon: 'error',
           confirmButtonText: 'OK'
         });
         return;
      }

      //API Call
      API.put("/users", {
         firstname: firstname,
         lastname: lastname,
         login: login,
         password: password,
      })
      .then((res) => {
         this.props.setUserDetails("userId", res.data.userId);
         this.props.setUserDetails("firstname", firstname);
         this.props.setUserDetails("lastname", lastname);
         this.props.setUserDetails("login", login);
         this.props.setUserDetails("creationDate", res.data.creationDate);
         this.props.setUserDetails("followings", []);

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
         <div id="main_register_page">
            <h1 id="new_user_register_text">S'enregistrer</h1>
            <form id="register_grid">
               <div id="firstname_place">
                  <span className="form-icon-register material-symbols-outlined">person</span>
                  <input autoComplete="given-name" className="input_form" placeholder=" " spellCheck={false} type="text" name="firstname" id="input_firstname_register" />
                  <div id="cut_firstname_signin"></div>
                  <label id="placeholder_input_firstname_register" htmlFor="input_firstname_register">Prénom</label>
               </div>

               <div id="lastname_place">
                  <span className="form-icon-register material-symbols-outlined">person</span>
                  <input autoComplete="name" className="input_form" placeholder=" " spellCheck={false} type="text" name="lastname" id="input_lastname_register" />
                  <div id="cut_lastname_signin"></div>
                  <label id="placeholder_input_lastname_register" htmlFor="input_lastname_register">Nom</label>
               </div>

               <div id="login_place_for_register">
                  <span className="form-icon-register material-symbols-outlined">login</span>
                  <input autoComplete="username" className="input_form" placeholder=" " spellCheck={false} type="text" name="login" id="input_register" />
                  <div id="cut_login_signin"></div>
                  <label id="placeholder_input_login_register" htmlFor="input_register">Login</label>
               </div>

               <div id="password_place_for_register">
                  <span className="form-icon-register material-symbols-outlined">lock</span>
                  
                  <input autoComplete="new-password" className="input_form" placeholder=" " spellCheck={false} type="password" name="password" id="input_password_register" onKeyUp={this.validatePasswords} />
                  <div id="cut_password_signin"></div>
                  <label id="placeholder_input_password_register" htmlFor="input_password_register">Mot de passe</label>

                  <span id="show_password" className="password-icon-register material-symbols-outlined" onClick={this.changePasswordState}>visibility_off</span>
               </div>

               <div id="confirm_password_place_for_register">
                  <span className="form-icon-register material-symbols-outlined">lock</span>
                  
                  <input autoComplete="new-password" className="input_form" placeholder=" " spellCheck={false} type="password" name="confirm_password" id="input_confirm_password_register" onKeyUp={this.validatePasswords} />
                  <div id="cut_confirm_password_signin"></div>
                  <label id="placeholder_input_confirm_password_register" htmlFor="input_confirm_password_register">Confirmer mot de passe</label>

                  <span id="show_confirm_password" className="password-icon-register material-symbols-outlined" onClick={this.changeConfirmPasswordState}>visibility_off</span>
               </div>

               <span id="password_validation">
                  <ul id="password_requirements_list">
                     <li>
                        <span id="low_upper_case_text">
                           <i id="low_upper_case" className="fas fa-xmark" aria-hidden="true"></i>
                           Minuscules & Majuscules (8 caractères minimum)
                        </span>
                    </li>
                    <li>
                        <span id="numbers_text">
                           <i id="numbers" className="fas fa-xmark" aria-hidden="true"></i>
                           Chiffres (0-9)
                        </span> 
                    </li>
                    <li>
                        <span id="special_chars_text">
                           <i id="special_chars" className="fas fa-xmark" aria-hidden="true"></i>
                           Caractères spéciaux (!@#$%^&*)
                        </span>
                    </li>
                    <li>
                        <span id="same_passwords_text">
                           <i id="same_passwords" className="fas fa-xmark" aria-hidden="true"></i>
                           Mot de passes identiques
                        </span>
                    </li>
                  </ul>
               </span>

               <button className="register_buttons" id="create_button_register" tabIndex={0} onClick={this.handleCreateUser}>Enregistrer</button> 
               <button className="register_buttons" id="cancel_button_register" onClick={ () => {
                  this.props.cancelAction();
               }} tabIndex={0}>Annuler</button>
            </form>
         </div>
      )
   }
}

export default SignIn;