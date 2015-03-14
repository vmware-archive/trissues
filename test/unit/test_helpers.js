var helpers;

helpers = {
  logMessages: [],
  stubLogging: function (module) {
    (module.__get__("helpers")).log = function (message) {
      helpers.logMessages.push(message);
    };
  }
};

module.exports = helpers;
