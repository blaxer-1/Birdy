import React from 'react';
import UserList from './UserList';
import MessagesList from './MessagesList';
import UserInfo from './UserInfo';
import { toast } from "react-toastify";
import { default as API } from './api';
import Fade from '@mui/material/Fade';
import LoadingCircle from './LoadingCircle';

//Slice() OU {...tbl} = copy => car sinon le tableau est passé par référence et non par copie

class UserProfile extends React.Component{

   constructor(props){
      super();

      this.state = {
         followers: [],
         pageLoaded: false,
         userViewDetails: {},
         isMyProfile: false,
      };
   }


   componentDidMount() {
      this.setState({
         isMyProfile: this.props.targetProfileId === this.props.userDetails.userId
      });

      API.get("/users/"+this.props.targetProfileId, {})
      .then((res) => {
         this.setState({
            userViewDetails: res.data.user,
            followers: res.data.user.followers,
            pageLoaded: true
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

   componentDidUpdate(prevProps, prevState) {
      if (prevProps.targetProfileId !== this.props.targetProfileId) {
         this.setState({
            pageLoaded: false,
            isMyProfile: this.props.targetProfileId === this.props.userDetails.userId
         });

         API.get("/users/"+this.props.targetProfileId, {})
         .then((res) => {
            this.setState({
               userViewDetails: res.data.user,
               followers: res.data.user.followers,
               pageLoaded: true
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
   }

   render() { 
      if (this.state.pageLoaded) {
         let title = this.state.isMyProfile ? "Mes messages" : ("Messages de @"+this.state.userViewDetails.login);

         return (
            <Fade in={this.state.pageLoaded}>
               <div id="container">
                  <div id="user_followers_followings">
                     <UserList isMyProfile={this.state.isMyProfile} fetchUserDetails={this.props.fetchUserDetails} userDetails={this.props.userDetails} type="followers" className="followers_place" title="Abonnés" users={this.state.followers}/>
                     <UserList isMyProfile={this.state.isMyProfile} fetchUserDetails={this.props.fetchUserDetails} userDetails={this.props.userDetails} type="followings" className="followings_place" title="Abonnements" users={this.state.isMyProfile ? this.props.userDetails.followings : this.state.userViewDetails.followings}/>
                  </div>

                  <div id="message_page_new_comment_messages">
                     <UserInfo
                        messagesList={this.props.messagesList}
                        setUserProfile={this.props.setUserProfile} 
                        fetchMessages={this.props.fetchMessages} 
                        isConnected={this.props.isConnected} 
                        userDetails={this.props.userDetails} 
                        fetchUserDetails={this.props.fetchUserDetails}
                        userViewDetails={this.state.userViewDetails}
                        isMyProfile={this.state.isMyProfile}
                     />        
                     <MessagesList 
                        setUserProfile={this.props.setUserProfile} 
                        targetProfileId={this.props.targetProfileId}
                        isMyProfile={this.state.isMyProfile}
                        fetchUserDetails={this.props.fetchUserDetails} 
                        userViewDetails={this.state.userViewDetails} 
                        fetchLikedMessages={this.props.fetchLikedMessages} 
                        messagesLiked={this.props.messagesLiked} 
                        fetchMessages={this.props.fetchMessages} 
                        userDetails={this.props.userDetails} 
                        className="message_page_messages" 
                        canDeleteMessage={this.state.isMyProfile} 
                        canFollowAuthor={!this.state.isMyProfile && (this.props.userDetails.followings.find((user) => {
                           return user.userId === this.props.targetProfileId}) === undefined)
                        } 
                        title={title} 
                        isConnected={this.props.isConnected}
                        messagesList={
                           this.props.messagesList.filter((message) => {
                              return message.authorId === this.state.userViewDetails.userId;
                           })
                        }
                     />
                  </div>
               </div>
            </Fade>
         )
      }


      return (
         <LoadingCircle />
      );
   }
}

export default UserProfile;