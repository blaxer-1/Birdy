let path = require("path");

origlog = console.log

function _getCallerFile() {
   var filename;
   var _pst = Error.prepareStackTrace
   Error.prepareStackTrace = function (err, stack) { return stack; };
   try {
      var err = new Error();
      var callerfile;
      var currentfile;
      currentfile = err.stack.shift().getFileName();
      while (err.stack.length) {
         callerfile = err.stack.shift().getFileName();
         if(currentfile !== callerfile) {
            filename = callerfile;
            break;
         }
     }
   } catch (err) {}
   Error.prepareStackTrace = _pst;
   return filename;
}

const Utils = {
   MAIN_SITE_ORIGIN: "http://localhost:3000",
   DEBUG: true,
   PORT: 8000,
   WS_PORT: 8080,
   DB_URI: "mongodb+srv://blaxer:"+process.env.MONGO_DB_PASSWORD+"@birdy.nwaqxqx.mongodb.net/?retryWrites=true&w=majority",
   CREATION_TIMESTAMP: 1680205994,
   maxLength: 256,
   basicRegex: /^[a-zA-Z0-9-_]+$/,
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
   isPasswordValid(password) {
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
   log: function (obj, ...argumentArray) {
      if (!Utils.DEBUG) {
         return;
      }

      let datePrefix = "["+new Date().toLocaleString()+"] \x1b[33m"+path.basename(_getCallerFile())+"\x1b[0m | ";
      if (typeof obj === 'string') {
         argumentArray.unshift(datePrefix + obj);
      } else {
         argumentArray.unshift(obj);
         argumentArray.unshift(datePrefix);
      }
      origlog.apply(this, argumentArray);
   }
}

module.exports = Utils;
