import React from 'react';
import NavigationPanel from './NavigationPanel';
import Login from './Login';
import SignIn from './SignIn';
import Statistiques from './Statistiques';
import NewComment from './NewComment';
import MessagesList from './MessagesList';
import UserNotConnected from './UserNotConnected';
import SearchPage from './SearchPage';
import API from './api';
import $ from 'jquery';
import { toast } from 'react-toastify';
import websocket from './websocket';
import UserProfile from './UserProfile';
import Utils from './Utils';

class MainPage extends React.Component {

   constructor(props) {
      super(props);

      this.state = { 
         currentPage: "message_page", 
         isConnected: false,
         searchParams: {
            searchInput: "",
            contactOnly: false,
         },
         messagesList: [],
         userDetails: {
            userId: -1,
            firstname: "",
            lastname: "",
            creationDate: "",
            login: "",
            followings: [],
         },
         targetProfileId: 0,
         usersList: [],
      };

      this.setLogin = this.setLogin.bind(this);
      this.setLogout = this.setLogout.bind(this);
      this.myProfile = this.myProfile.bind(this);
      this.setSignIn = this.setSignIn.bind(this);
      this.setMainPage = this.setMainPage.bind(this);
      this.setSearch = this.setSearch.bind(this);
      this.setConnected = this.setConnected.bind(this);
      this.setUserDetails = this.setUserDetails.bind(this);
      this.fetchMessages = this.fetchMessages.bind(this);
      this.fetchUserDetails = this.fetchUserDetails.bind(this);
      this.setUserProfile = this.setUserProfile.bind(this);

      this.websocketHandleFunction = this.websocketHandleFunction.bind(this);
   }

   //-------------------WEBSOCKET-------------------//
   websocketHandleFunction(event) {
      if (!this.state.isConnected) {
         return;
      }
      let data = JSON.parse(event.data);

      console.log("WebSocket | [message] Data received from server: " + JSON.stringify(data));

      if (data.eventName === "refreshMessages") {
         this.fetchMessages();
         return;
      }

      if (data.eventName === "receivedNewMessage") {
         Utils.notifyUser("@"+data.eventParams.author + " a publié un nouveau message !")
         return;
      }

      if (data.eventName === "receivedNewMessageReply") {
         Utils.notifyUser("@"+data.eventParams.author + " a publié un nouveau message en réponse à @"+data.eventParams.authorMainMessage+" !")
         return;
      }
   }
   //-------------------WEBSOCKET-------------------//

   componentDidMount() {
      websocket.addEventListener("message", this.websocketHandleFunction);

      if (!this.state.isConnected)
         return;

      this.fetchMessages();
   }

   componentWillUnmount() {
      websocket.removeEventListener("message", this.websocketHandleFunction);
   }

   //Listen for isConnected state change
   componentDidUpdate(prevProps, prevState) {
      if (prevState.isConnected !== this.state.isConnected && this.state.isConnected) {
         this.fetchMessages();
      }

      /*if (prevState.currentPage !== this.state.currentPage && (this.state.currentPage === "message_page" || this.state.currentPage === "my_profile" || this.state.currentPage === "search_page")) { 
         this.fetchMessages();
         this.fetchLikedMessages();
      }*/
   }

   setMainPage() {
      //Main Page
      this.setState({ currentPage: "message_page" });
   }

   setLogin() {

      //Connexion Page
      this.setState({ currentPage: "connexion_page" });
   }

   setSignIn() {

      //Register Page
      this.setState({ currentPage: "signin_page" });
   }

   setLogout() {
      //Déconnexion
      API.post("/logout")
      .then((res) => {
         this.setState({ 
            currentPage: "message_page", 
            isConnected: false,
            searchParams: {
               searchInput: "",
               contactOnly: false,
            },
            messagesList: [],
            userDetails: {
               userId: -1,
               firstname: "",
               lastname: "",
               nbMessagesEnvoyes: 0,
               nbAbonnes: 0,
               nbAbonnements: 0,
               creationDate: "",
               login: "",
               followers: [],
               followings: [],
            },
            targetProfileId: 0, 
         });
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

   myProfile() {
      //Mon Profil
      this.setState({ 
         currentPage: "profile_page", 
         targetProfileId: this.state.userDetails.userId
      });
   }

   setConnected(val) {
      this.setState({ isConnected: val });
   }

   setSearch(input, isContactOnly) {

      //Page de recherche
      this.setState({
         currentPage: "search_page",
         searchParams: {
            searchInput: input,
            contactOnly: isContactOnly,
         },
      });
   }

   setUserDetails(key, value) {
      let userDetailsTemp = this.state.userDetails;
      userDetailsTemp[key] = value;

      this.setState({
         userDetails: userDetailsTemp,
      });
   }

   setUserProfile(targetId) {
      //Profile Page
      this.setState({ 
         currentPage: "profile_page", 
         targetProfileId: targetId
      });
   }

   //-------------------API-------------------//
   fetchMessages() {
      API.get("/messages")
      .then((res) => {
         this.setState({
            messagesList: res.data.messagesList.reverse()
         })

         //Auto scroll messages list go to top as message are inserted at the beginning of the list
         setTimeout(() => {
            $('#comments_list_outer').animate({scrollTop: 0}, 1000); 
         }, 500);
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

      API.get("/users/list")
      .then((res) => {
         this.setState({
            usersList: res.data.users,
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

   fetchUserDetails() {
      if (!this.state.isConnected)
         return;

      API.get("/users")
      .then((res) => {
         this.setUserDetails("userId", res.data.user.userId);
         this.setUserDetails("firstname", res.data.user.firstname);
         this.setUserDetails("lastname", res.data.user.lastname);
         this.setUserDetails("creationDate", res.data.user.creationDate);
         this.setUserDetails("login", res.data.user.login);
         this.setUserDetails("followings", res.data.user.followings);

         console.log("Updated userDetails for", res.data.user.login)
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

      API.get("/users/list")
      .then((res) => {
         this.setState({
            usersList: res.data.users,
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
   //-------------------API-------------------//

   render() {
      return (
         <div id="main_container">
            <NavigationPanel targetProfileId={this.state.targetProfileId} userDetails={this.state.userDetails} setSearch={this.setSearch} currentPage={this.state.currentPage} mainPage={this.setMainPage} login={this.setLogin} logout={this.setLogout} signin={this.setSignIn} isConnected={this.state.isConnected} myProfile={this.myProfile}/>

            {
               this.state.currentPage === "connexion_page" && (
                  <div className="align-center">
                     <Login setConnected={this.setConnected} setUserDetails={this.setUserDetails} setMainPage={this.setMainPage} cancelAction={this.setMainPage}/>
                  </div>
               )
            }

            {
               this.state.currentPage === "signin_page" && (
                  <div className="align-center">
                     <SignIn setConnected={this.setConnected} setUserDetails={this.setUserDetails} setMainPage={this.setMainPage} cancelAction={this.setMainPage}/>
                  </div>
               )
            }

            {
               this.state.currentPage === "message_page" && (
                  <div id="container">
                     <Statistiques />

                     {
                        this.state.isConnected ? (
                           <div id="message_page_new_comment_messages">
                              <NewComment setUserDetails={this.setUserDetails} fetchUserDetails={this.fetchUserDetails} fetchMessages={this.fetchMessages} isConnected={this.state.isConnected} userDetails={this.state.userDetails}/>
                              <MessagesList 
                                 targetProfileId={this.state.targetProfileId} 
                                 setUserProfile={this.setUserProfile} 
                                 fetchUserDetails={this.fetchUserDetails} 
                                 userDetails={this.state.userDetails} 
                                 fetchMessages={this.fetchMessages} 
                                 className="message_page_messages" 
                                 canDeleteMessage={false} 
                                 title="Liste des messages" 
                                 isConnected={this.state.isConnected} 
                                 messagesList={this.state.messagesList}
                              />
                           </div>
                        ) : (
                           <UserNotConnected login={this.setLogin}/>
                        )
                     }
                  </div>
               )
            }

            {
               this.state.currentPage === "search_page" && (
                  <SearchPage 
                     searchParams={this.state.searchParams} 
                     userDetails={this.state.userDetails}
                     messagesList={this.state.messagesList}
                     isConnected={this.state.isConnected}
                     fetchMessages={this.fetchMessages}
                     fetchUserDetails={this.fetchUserDetails} 
                     setUserProfile={this.setUserProfile}
                     usersList={this.state.usersList}
                  />
               )
            }

            {
               this.state.currentPage === "profile_page" && (
                  <UserProfile 
                     searchParams={this.state.searchParams} 
                     userDetails={this.state.userDetails}
                     messagesList={this.state.messagesList}
                     isConnected={this.state.isConnected}
                     fetchMessages={this.fetchMessages}
                     fetchUserDetails={this.fetchUserDetails}
                     targetProfileId={this.state.targetProfileId} 
                     setUserProfile={this.setUserProfile}
                  />
               )
            }
         </div>
      )
   }
}

export default MainPage;