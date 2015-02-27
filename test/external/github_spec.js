/*globals describe, it, beforeEach */
/*jshint expr:true*/

require("should");
var restify = require("restify"),
    octonode = require("octonode"),
    config = require("environmental").config();

describe("GitHub Issues public API", function () {
  var client;

  beforeEach(function () {
    client = restify.createJsonClient({
      url: "https://api.github.com/",
      headers: {
        Authorization: "token " + config.auth.github
      }
    });
  });

  it("returns a project's issues in JSON", function (done) {
    client.get("/repos/pivotaltracker/trissues/issues", function (err, req, res, obj) {
      console.log(res.body);
      console.log(res.statusCode);
      console.log(obj);
      done();
    });
  });

  it("can change the labels on an issue", function (done) {
    var github = octonode.client(config.auth.github),
        issue = github.issue("pivotaltracker/trissues", 1);

    issue.info(function (err, issueHash) {
      var newLabelNames = [],
          labelNames = issueHash.labels.map(function (labelObj) { return labelObj.name; });
      if (labelNames.indexOf("started") === -1) {
        newLabelNames = labelNames.filter(function (label) { return label !== "unstarted"; });
        newLabelNames.push("started");
      } else {
        newLabelNames = labelNames.filter(function (label) { return label !== "started"; });
        newLabelNames.push("unstarted");
      }

      issue.update({ labels: newLabelNames }, function () {
        done();
      });
    });
  });
});
