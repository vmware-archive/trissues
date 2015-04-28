/*globals describe, it, beforeEach, afterEach, rewireInApp, loadJsonFixture, loadJsonFile */
/*jshint expr:true*/

require("should");
var mitmFactory = require("mitm"),
    config = require("environmental").config(),
    Promise = require("bluebird"),
    testHelpers = require("./test_helpers.js"),
    mitm,

    projectId = 1286564,

// code under test
    fromTracker = rewireInApp("fromTracker");

describe("fromTracker", function () {
  beforeEach(function () {
    fromTracker.setConfig(config);
    testHelpers.stubLogging(fromTracker);
  });

  describe("#updateStateLabelsInGitHub", function () {
    beforeEach(function () {
      mitm = mitmFactory();
      config.tracker = {
        projectid: projectId,
        integrationid: "33098"
      };
    });

    afterEach(function () {
      mitm.disable();
    });

    function testTrackerWebhookToGitHubUpdate(webhookFixture, done) {
      var activity = loadJsonFixture(webhookFixture),
          trackerStoryResponse = loadJsonFile("trackerLinkedStoryResponse"),
          issueGetResponse = loadJsonFile("githubIssueGetResponse"),
          storyId = 89146028,
          issueNumber = 2;

      mitm.on("request", function (req, res) {
        res.statusCode = 200;
        if (req.method === "GET") {
          if (req.url === "/services/v5/projects/" + projectId + "/stories/" + storyId + "?envelope=true") {
            res.end(trackerStoryResponse);
          } else if (req.url === "/repos/pivotaltracker/trissues/issues/" + issueNumber + "?access_token=fake-test-token") {
            res.end(issueGetResponse);
          } else {
            ("Unexpected url requested: " + req.url).should.equal(null);
          }
        } else if (req.method === "POST") {    // simulated PATCH
          req.url.should.equal("/repos/pivotaltracker/trissues/issues/" + issueNumber + "?access_token=fake-test-token");
          res.end(JSON.stringify(JSON.parse(issueGetResponse)));   // send back unmodified resource, OK because code never looks at content
        } else {
          ("Should not be receiving a " + req.method + " request").should.equal(null);
        }
      });

      var promises = [],
          changeHash = activity.changes[0];
      fromTracker.updateStateLabelsInGitHub(promises, activity, changeHash);
      Promise.settle(promises).then(function () {
        testHelpers.anyErrors().should.equal(false);
        done();
      });
    }

    it("sends label updates to GH when linked story is created in Tracker", function (done) {
      testTrackerWebhookToGitHubUpdate("trackerWebhookLinkedStoryCreate", done);
    });

    //it("sends label updates to GH when linked story is deleted in Tracker", function (done) {
    //  testTrackerWebhookToGitHubUpdate("trackerWebhookLinkedStoryDelete", done);
    //});
  });
});
