import React from 'react';
import SearchBar from './SearchBar';
import MainLogo from './MainLogo';
import UserInteractionButton from './UserInteractionButton';
import Notifications from './Notifications'


class NavigationPanel extends React.Component {

   constructor(props) {
      super()
   }

   render() {
      return (
         <header id="header_top">
            <MainLogo main={this.props.mainPage}/>

            <SearchBar setSearch={this.props.setSearch} isConnected={this.props.isConnected}/>

            <div id="user_interactions">
            
               <Notifications />

               {
                  this.props.isConnected ? (
                     this.props.currentPage === "profile_page" && this.props.targetProfileId === this.props.userDetails.userId ? (
                        <React.Fragment>
                           <UserInteractionButton buttonLabel="Mur de messages" clickAction={this.props.mainPage} position={1}/>
                           <UserInteractionButton buttonLabel="Déconnexion" clickAction={this.props.logout} position={2}/>
                        </React.Fragment>
                     ) : (
                        <React.Fragment>
                           <UserInteractionButton buttonLabel="Mon Profile" clickAction={this.props.myProfile} position={1}/>
                           <UserInteractionButton buttonLabel="Déconnexion" clickAction={this.props.logout} position={2}/>
                        </React.Fragment>
                     )
                  ) : (
                     <React.Fragment>
                        <UserInteractionButton buttonLabel="Connexion" clickAction={this.props.login} position={1}/>
                        <UserInteractionButton buttonLabel="S'enregistrer" clickAction={this.props.signin} position={2}/>
                     </React.Fragment>
                  )
               }
            </div>
         </header>
      )
   }
}

export default NavigationPanel;