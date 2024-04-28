import React from 'react';
import Logo from './img/logo.png';

class MainLogo extends React.Component {

   constructor(props) {
      super();
   }

   render() {
      return (
         <div id="logo_container">
            <img src={Logo} id="logo" alt="" onClick={ () => this.props.main() } />
            <p id="logo_title" onClick={ () => this.props.main() }>Birdy</p>
         </div>
      )
   }
}

export default MainLogo;