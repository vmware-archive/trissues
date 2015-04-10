/*globals describe, it, beforeEach, afterEach, rewireInApp, loadJsonFixture, loadJsonFile */
/*jshint expr:true*/

var mitmFactory = require("mitm"),
    Promise = require("bluebird"),
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
          trackerSearchLinkedStory = loadJsonFile("trackerSearchLinkedStory"),
          storyId = 2208,
          putLabels = null;

      mitm.on("request", function (req, res) {
        res.statusCode = 200;
        if (req.method === "GET") {
          if (req.url === "/services/v5/projects/" + projectId + "/search?query=external_id%3A2&envelope=true") {
            console.log("HEllo from MITM land!");
            res.end(trackerSearchLinkedStory);
          } else {
            ("Unexpected url requested: " + req.url).should.equal(null);
          }
        } else if (req.method === "PUT") {
          req.url.should.equal("/services/v5/projects/" + projectId + "/stories/" + storyId);
          putLabels = req.body;

          var responseObj = { it: "worked" };
          res.end(JSON.stringify(responseObj));
        } else {
          ("Should not be receiving a "+req.method+" request").should.equal(null);
        }
      });

      fromGitHub.updateStoryLabelsInTracker(promises, loadJsonFixture("githubWebhookLabelAdd"));
      Promise
          .settle(promises)
          .then(function () {
            console.log(arguments);
            putLabels.should.equal("fred");
          });
    });
  });
});
