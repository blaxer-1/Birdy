import React from 'react';
import UserList from './UserList';
import MessagesList from './MessagesList';
import $ from 'jquery';

class SearchPage extends React.Component{

   constructor(props){
      super(props);

      this.getMessages = this.getMessages.bind(this);
   }

   getMessages() {
      let messages = this.props.messagesList;

      //Filter messages to match query
      let searchQuery = this.props.searchParams;

      messages = messages.filter((message) => {

         //Match text message search query
         let textValid = message.text.toLowerCase().includes(searchQuery.searchInput.toLowerCase());
         

         //Match author search query
         let authorValid = message.author.toLowerCase().includes(searchQuery.searchInput.toLowerCase())

         return textValid || authorValid;
      })

      return messages;
   }

   render(){
      let usersMatchQuery = [];
      let messages = [];

      console.log(this.props.usersList)
      if (this.props.searchParams.contactOnly) {
         usersMatchQuery = this.props.usersList.filter((user) => {
            //Pas l'user courant & inclut la searchQuery & contactOnly
            return (this.props.userDetails.followings.find((user2) => {return user.userId === user2.userId}) !== undefined) && user.userId !== this.props.userDetails.userId && user.login.toLowerCase().includes(this.props.searchParams.searchInput.toLowerCase());
         });

         messages = this.props.messagesList.filter((message) => {

            //Match text message search query
            let textValid = message.text.toLowerCase().includes(this.props.searchParams.searchInput.toLowerCase());
            

            //Match author search query
            let authorValid = message.author.toLowerCase().includes(this.props.searchParams.searchInput.toLowerCase())

            return (this.props.userDetails.followings.find((user2) => {return message.authorId === user2.userId}) !== undefined) && (textValid || authorValid);
         })
      } else {
         usersMatchQuery = this.props.usersList.filter((user) => {
            //Pas l'user courant & inclut la searchQuery
            console.log(user)
            return user.userId !== this.props.userDetails.userId && user.login.toLowerCase().includes(this.props.searchParams.searchInput.toLowerCase());
         });

         messages = this.props.messagesList.filter((message) => {

            //Match text message search query
            let textValid = message.text.toLowerCase().includes(this.props.searchParams.searchInput.toLowerCase());
            

            //Match author search query
            let authorValid = message.author.toLowerCase().includes(this.props.searchParams.searchInput.toLowerCase())

            return textValid || authorValid;
         })
      }
   
      //Set input for search query
      $("#search_bar_input").val(this.props.searchParams.searchInput);
      $("#checkbox_contact_only").val(this.props.searchParams.contactOnly);

      return(
         <div id="container">
            <UserList fetchUserDetails={this.props.fetchUserDetails} userDetails={this.props.userDetails} type="search" className="search_user_list" title="Utilisateurs" users={usersMatchQuery}/>
            <MessagesList setUserProfile={this.props.setUserProfile} fetchUserDetails={this.props.fetchUserDetails}  messagesLiked={this.props.messagesLiked} fetchLikedMessages={this.props.fetchLikedMessages} userDetails={this.props.userDetails} fetchMessages={this.props.fetchMessages} className="search_messages_list" canDeleteMessage={false} canFollowAuthor={true} title="Liste des messages" isConnected={this.props.isConnected} messagesList={messages}/>
         </div>
      );
   }
}

export default SearchPage;