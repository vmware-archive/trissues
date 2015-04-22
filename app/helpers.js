
var Promise = require("bluebird"),
    helpers;

helpers = {
  log: function () {
    console.log.apply(console, arguments);
  },

  emptyPromise: function () {
    var promiseResolver,
        promiseRejecter,
        promise = new Promise(function (resolver, rejecter) {
          promiseResolver = resolver;
          promiseRejecter = rejecter;
        });
    promise.resolve = function () {
      promiseResolver.apply(this, arguments);
      return promise;
    };
    promise.reject = function () {
      promiseRejecter.apply(this, arguments);
      return promise;
    };

    return promise;
  }
};

module.exports = helpers;
