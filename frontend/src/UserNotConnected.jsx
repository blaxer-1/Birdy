import React from 'react';

class MainPage extends React.Component {

   constructor(props) {
      super()

      this.handleNeedConnexion = this.handleNeedConnexion.bind(this);
   }

   handleNeedConnexion(e) {
      this.props.login();
   }

   render() {
      return (
         <div id="not_connected_user" onClick={this.handleNeedConnexion}>
            <p>Vous devez être connecté pour voir et envoyer des messages</p>
         </div>
      )
   }
}

export default MainPage;