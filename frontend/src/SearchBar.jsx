import React from 'react';
import $ from 'jquery';
import { toast } from "react-toastify";

class SearchBar extends React.Component {

   constructor(props) {
      super()

      this.handleSearchButton = this.handleSearchButton.bind(this);
      this.inputInteraction = this.inputInteraction.bind(this);
   }

   inputInteraction(e) {
      if (e.target.value) {
         $("#search_bar_button").css("cursor", "pointer");
      } else {
         $("#search_bar_button").css("cursor", "not-allowed");
      }
   }

   handleSearchButton(e) {
      if (!this.props.isConnected) {
         toast.error("Vous devez être connecté pour effectué une recherche", {
            position: "top-left",
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: false,
            progress: undefined,
            theme: "light",
         });
         return;
      }

      //Return si l'input est vide
      if (!($("#search_bar_input").val()))
         return;

      
      let inputSearch = $("#search_bar_input").val();
      let isContactsOnly = $('#checkbox_contact_only').is(":checked");

      //Change page to new search page
      this.props.setSearch(inputSearch, isContactsOnly);
   }

   render() {
      return (
         <div id="search_container">
            <div id="search_bar_input_button">
               <input onInput={this.inputInteraction} spellCheck={false} type="text" name="search_bar" id="search_bar_input" placeholder="Rechercher un ami ou un message" />
               <button id="search_bar_button" onClick={this.handleSearchButton} tabIndex={0}>
                  <svg width="100%" height="100%" version="1.1" viewBox="0 0 20 20" x="0px" y="0px"><g><path fillRule="evenodd" d="M13.192 14.606a7 7 0 111.414-1.414l3.101 3.1-1.414 1.415-3.1-3.1zM14 9A5 5 0 114 9a5 5 0 0110 0z" clipRule="evenodd"></path></g></svg>
               </button> 
            </div>
            <div id="checkbox_label_contacts_only">
               <input type="checkbox" name="contacts_only" id="checkbox_contact_only" /><label htmlFor="contacts_only" id="contacts_only_text">Contacts Uniquement</label>
            </div>
         </div>
      )
   }
}

export default SearchBar;