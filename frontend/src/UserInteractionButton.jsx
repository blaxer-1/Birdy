import React from 'react';

class UserInteractionButton extends React.Component {

   constructor(props) {
      super()
   }

   render() {
      return (
         <button id="login_button_class" className={ this.props.position === 1 ? "custom-button user_interactions_buttons user_interactions_buttons_position_1" : "custom-button user_interactions_buttons user_interactions_buttons_position_2"} onClick={ () => { 
            this.props.clickAction()
         }} tabIndex={0}>{this.props.buttonLabel}</button>
      )
   }

}

export default UserInteractionButton;