/*globals describe, it, beforeEach, afterEach, rewireInApp, loadJsonFixture, loadJsonFile */
/*jshint expr:true*/


var should = require("should"),
    sinon = require("sinon"),
    fs = require("fs"),
    mitmFactory = require("mitm"),
    parseXml = require("xml2js").parseString,
    testHelpers = require("./test_helpers.js"),

// code under test
    handlers = rewireInApp("handlers"),

    config, sandbox, res, next, mitm;


describe("handlers", function () {
  beforeEach(function () {
    testHelpers.stubLogging(handlers);

    config = handlers.__get__("config");
    sandbox = sinon.sandbox.create();
    res = { send: sandbox.stub() };
    next = sandbox.stub();
    mitm = mitmFactory();
  });
  afterEach(function () {
    sandbox.restore();
    mitm.disable();
  });

  describe("/githubissues", function () {
    var jsonResponse = fs.readFileSync(__dirname + "/../fixtures/json/githubIssuesResponse.json", { encoding: "utf8" }),
        xmlResponse = fs.readFileSync(__dirname + "/../fixtures/xml/fixtureResponse.xml", { encoding: "utf8" });

    it("returns fixture stories", function (done) {
      mitm.on("request", function (req, res) {
        req.method.should.equal("GET");
        req.url.should.equal("/repos/pivotaltracker/trissues/issues");
        res.statusCode = 200;
        res.end(jsonResponse);
      });

      next = function () {
        res.send.calledOnce.should.be.true;
        res.send.firstCall.args[0].should.equal(200);
        res.send.firstCall.args[1].replace(/\s+/g, "").should.equal(xmlResponse.replace(/\s+/g, ""));

        done();
      };
      handlers.githubissues(null, res, next);
    });

    describe("filtering by label", function () {
      function getIssues(res, done, callback) {
        mitm.on("request", function (req, res) {
          req.method.should.equal("GET");
          req.url.should.equal("/repos/pivotaltracker/trissues/issues");
          res.statusCode = 200;
          res.end(jsonResponse);
        });

        next = function () {
          res.send.calledOnce.should.be.true;
          res.send.firstCall.args[0].should.equal(200);

          callback();
          done();
        };
        handlers.githubissues(null, res, next);
      }

      function gotIssues(ids) {
        var numbersOnly;
        parseXml(res.send.firstCall.args[1], function (err, result) {
          numbersOnly = result.external_stories.external_story.map(function (story) {
            return parseInt(story.external_id[0]);
          });
        });
        numbersOnly.should.be.eql(ids);
      }

      it("can filter out specified label", function (done) {
        config.exclude = { labels: "feature" };
        getIssues(res, done, function () {
          gotIssues([1]);
        });
      });

      it("can filter out multiple specified labels", function (done) {
        config.exclude = { labels: "feature, low-priority" };
        getIssues(res, done, function () {
          var externalStories = null;
          parseXml(res.send.firstCall.args[1], function (err, result) {
            externalStories = result.external_stories;
          });

          should.not.exist(externalStories.externalStory);
        });
      });
    });
  });

  describe("/fromtracker", function () {
    afterEach(function () {
      next.calledOnce.should.be.true;
      res.send.calledOnce.should.be.true;
      res.send.firstCall.args[0].should.equal(200);
    });

    it("accepts but ignores activity we don't care about", function () {
      var req = { body: loadJsonFixture("trackerWebhookTaskEdit") };
      handlers.fromtracker(req, res, next);
    });

    it("sends label updates to GH when linked story in Tracker changes state", function (done) {
      var req = { body: loadJsonFixture("trackerWebhookLinkedStoryStarted") },
          trackerStoryResponse = loadJsonFile("trackerLinkedStoryResponse"),
          issueGetResponse = loadJsonFile("githubIssueGetResponse"),
          projectId = 1286564,
          storyId = 89146028,
          issueNumber = 2;

      config.tracker = { integrationid: "33098" };

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
          var responseObj = JSON.parse(issueGetResponse);
          res.end(JSON.stringify(responseObj));   // send back unmodified resource, OK because code never looks at content
        } else {
          ("Should not be receiving a " + req.method + " request").should.equal(null);
        }
      });

      next = sandbox.spy(function () {
        res.send.calledOnce.should.be.true;
        res.send.firstCall.args[0].should.equal(200);

        done();
      });
      handlers.fromtracker(req, res, next);
    });
  });

  describe("/fromgithub", function () {
    var fromGitHub, isIssueStub, updateStoryStub, next,
        webhookHash = loadJsonFixture("githubWebhookLabelRemove"),
        req = { body: webhookHash };

    beforeEach(function () {
      fromGitHub = handlers.__get__("fromGitHub");
      isIssueStub = sandbox.stub(fromGitHub, "isIssueWithLabelChange");
      updateStoryStub = sandbox.stub(fromGitHub, "updateStoryLabelsInTracker");
    });

    afterEach(function () {
      isIssueStub.calledOnce.should.be.true;
      next.calledOnce.should.be.true;
    });

    it("ignores GH webhook POSTs that don't indicate label changes on an Issue", function (done) {
      isIssueStub.returns(false);
      next = sandbox.spy(function () {
        res.send.calledOnce.should.be.true;
        res.send.firstCall.args[0].should.equal(200);

        done();
      });
      handlers.fromgithub(req, res, next);
      updateStoryStub.called.should.be.false;
    });

    it("calls the method to update labels in Tracker if the webhook POST is a label change", function (done) {
      isIssueStub.returns(true);
      next = sandbox.spy(function () {
        res.send.calledOnce.should.be.true;
        res.send.firstCall.args[0].should.equal(200);

        done();
      });
      handlers.fromgithub(req, res, next);
      updateStoryStub.called.should.be.true;
      updateStoryStub.firstCall.args[0].should.equal(webhookHash);
    });
  });
});
