/*globals describe, it, beforeEach, afterEach, rewireInApp, loadJsonFixture, loadJsonFile */
/*jshint expr:true*/

var mitmFactory = require("mitm"),
    config = require("environmental").config(),
    mitm,

    projectId = 101,

// code under test
    fromGitHub = rewireInApp("fromGitHub");

describe("fromGitHub", function () {
  beforeEach(function () {
    fromGitHub.setConfig(config);
  });

  describe("#isIssueFromLabelChange", function () {
    it("returns true when a label is added", function () {
      fromGitHub.isIssueWithLabelChange([], loadJsonFixture("githubWebhookLabelAdd")).should.be.true;
    });

    it("returns true when a label is removed", function () {
      fromGitHub.isIssueWithLabelChange([], loadJsonFixture("githubWebhookLabelRemove")).should.be.true;
    });

    it("returns false for webhooks with non-label actions", function () {
      fromGitHub.isIssueWithLabelChange([], loadJsonFixture("githubWebhookIssueClosed")).should.be.false;
    });
  });

  describe("#updateStoryLabelsInTracker", function () {
    beforeEach(function () {
      mitm = mitmFactory();
      config.tracker = { projectid: projectId };
    });

    afterEach(function () {
      mitm.disable();
    });

    it("Updates tracker if necessary", function () {
      var promises = [],
          trackerSearchLinkedStory = loadJsonFile("trackerSearchLinkedStory");

      mitm.on("request", function (req, res) {
        res.statusCode = 200;
        if (req.method === "GET") {
          if (req.url === "/services/v5/projects/" + projectId + "/search?query=external_id%3A2&envelope=true") {
            console.log("HEllo from MITM land!");
            console.log(trackerSearchLinkedStory);
            res.end(trackerSearchLinkedStory);
          } else {
            ("Unexpected url requested: " + req.url).should.equal(null);
          }
        //} else if (req.method === "POST") {    // simulated PATCH
        //  req.url.should.equal("/repos/pivotaltracker/trissues/issues/" + issueNumber + "?access_token=fake-test-token");
        //  var responseObj = JSON.parse(issueGetResponse);
        //  do some things to the model
          //res.end(JSON.stringify(responseObj));
        } else {
          ("Should not be receiving a "+req.method+" request").should.equal(null);
        }
      });

      fromGitHub.updateStoryLabelsInTracker(promises, loadJsonFixture("githubWebhookLabelAdd"));
      promises[0].
          then(function () {
            console.log(arguments);
          });
    });
  });
});
