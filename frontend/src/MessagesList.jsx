import React from 'react';
import Comment from './Comment';


class MessagesList extends React.Component {

   constructor(props) {
      super()
   }

   render() {
      let messages = this.props.messagesList.map((message) => {
         let nbLike = message.likes.length;
         let isLikedByMe = message.likes.find((uId) => uId === this.props.userDetails.userId) !== undefined ? true : false;

         return (
            <Comment
               targetProfileId={this.props.targetProfileId}
               userViewDetails={this.props.userViewDetails}
               nbReplies={message.replies.length}
               replies={message.replies}
               likedByMe={isLikedByMe}
               likes={nbLike}
               fetchMessages={this.props.fetchMessages}
               userDetails={this.props.userDetails}
               fetchUserDetails={this.props.fetchUserDetails} 
               key={message.id}
               id={message.id}
               isConnected={this.props.isConnected} 
               user={message.author}
               authorId={message.authorId} 
               date={message.date} 
               text={message.text}
               canFollowAuthor={message.authorId !== this.props.userDetails.userId &&  (this.props.userDetails.followings.find((user) => { return user.userId === message.authorId}) === undefined)}
               canDeleteMessage = {this.props.canDeleteMessage}
               setUserProfile={this.props.setUserProfile} 
            />
         )
      })

      return (
         <div className={this.props.className} id="comments">
            <h4 id="title_comments">{this.props.title}</h4>
            <div id="comments_list_outer">
               <div id="comments_list_inner">
                  {messages}
               </div>
            </div>
         </div>
      )
   }

}

export default MessagesList;