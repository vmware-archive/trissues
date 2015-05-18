var helpers;

helpers = {
  logMessages: [],

  stubLogging: function (module) {
    (module.__get__("helpers")).log = function (message) {
      helpers.logMessages.push(message);
    };
  },

  anyErrors: function (expectErrors) {
    return helpers.logMessages.some(function (message) {
      var match = (typeof message === "string") && message.match(/--[A-Z ]+/);
      if (match && !expectErrors) {
        console.log("DIDN'T EXPECT TO FIND A FAILURE MESSAGE.  All messages:");
        console.log(helpers.logMessages);
      }
      return match;
    });
  }
};

module.exports = helpers;
