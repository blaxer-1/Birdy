import React from 'react';
import API from './api';
import { toast } from 'react-toastify';
import Fade from '@mui/material/Fade';
import websocket from './websocket';

class Statistiques extends React.Component {

   constructor(props) {
      super()

      this.state = {
         statistiques: {}
      }

      this.handleWebsocket = this.handleWebsocket.bind(this);
   }

   setStats(key, value) {
      let statsTmp = this.state.statistiques;
      statsTmp[key] = value;

      this.setState({
         statistiques: statsTmp,
      });
   }

   //-------------------Websocket-------------------//
   handleWebsocket(event) {
      let data = JSON.parse(event.data);

      console.log("WebSocket | [message] Data received from server: " + JSON.stringify(data));

      if (data.eventName === "refreshStats") {
         this.fetchStats();
         return;
      }
   }

   componentDidMount() {
      websocket.addEventListener("message", this.handleWebsocket);
      this.fetchStats();
   }

   componentWillUnmount() {
      websocket.removeEventListener("message", this.handleWebsocket);
   }
   //-------------------Websocket-------------------//


   //-------------------API-------------------//
   fetchStats() {
      API.get("/stats", {})
      .then((res) => {
         let stats = res.data.stats;
         for (let key in stats) {
            this.setStats(key, stats[key]);
         }
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
      let statsRendered = [];
      let stats = this.state.statistiques;
      for (let key in stats) {
         statsRendered.push(<li className="basic_stat" key={key}>{stats[key].label}: {stats[key].value}</li>)
      }

      return (
         <div id="stats">
            <h2 id="title_stats">Statistiques Birdy</h2>
            <Fade in={true} timeout={1000}>
               <div id="stats_text">
                  <div id="stats_text_inner"> 
                     {statsRendered}
                  </div>
               </div>
            </Fade>
         </div>
      )
   }

}

export default Statistiques;