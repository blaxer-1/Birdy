import React from 'react';

class Separator extends React.Component {

   constructor(props) {
      super()
   }

   render() {
      return (
         <div className="loader-wrapper">
            <div className="loader-box">
               <div className="loader-circle"></div>
               <div className="loader-text">Chargement...</div>
            </div>
         </div>
      )
   }

}

export default Separator;