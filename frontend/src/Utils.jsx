import { toast } from 'react-toastify';

const Utils = {
   maxLength: 256,
   basicRegex: /^[a-zA-Z0-9-_]+$/,
   SOCKET_URL: "ws://localhost:8080/",
   escapeHtml: function(string) {
      const htmlEscapeMap = {
         '<': '',
         '>': '',
         '"': '',
         "'": '',
         '/': ''
      };
      return String(string).replace(/[&<>"'/]/g, function (s) {
         return htmlEscapeMap[s];
      });
   },
   escapeJs: function(string) {
      return string.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
   },
   isInputValid: function(str) {
      return Utils.basicRegex.test(str);
   },
   isPasswordValid: function(password) {
      let strength = 0;
      password = Utils.escapeHtml(password);
      if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) {
        strength += 1;
      }
      if (password.match(/([0-9])/)) {
        strength += 1;
      }
      if (password.match(/([!,%,&,@,#,$,^,*,?,_,~])/)) {
        strength += 1;
      }
      if (password.length >= 8) {
        strength += 1;  
      }
      return (strength === 4);
   },
   notifyUser: function(message) {
      if (!('Notification' in window)) {
         toast.info("Ce navigateur ne prend pas en charge la notification de bureau", {
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

      if (Notification.permission === "granted") {
         new Notification(message);
      } else if (Notification.permission !== 'denied') {
         Notification.requestPermission().then((permission) => {
            if (permission === 'granted') {
              new Notification(message);
            }
         })
      }
   }
}

export default Utils;