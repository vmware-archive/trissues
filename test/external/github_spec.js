/*globals describe, it */
/*jshint expr:true*/

require("should");
var restify = require("restify"),
    config = require("environmental").config();

describe("GitHub Issues public API", function () {
  it("returns a project's issues in JSON", function () {
    var client = restify.createJsonClient({
      url: "https://api.github.com/",
      headers: {
        Authorization: "token " + config.auth.github
      }
    });
    client.get("/repos/pivotaltracker/trissues/issues", function (err, req, res, obj) {
      console.log(res.body);
      console.log(res.statusCode);
      console.log(obj);
    });
  });
});
