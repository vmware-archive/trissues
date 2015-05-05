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
  var trackerIps = [
          "67.214.223.6", "67.214.223.25", "208.85.150.190", "208.85.150.184",
          "67.214.223.7", "67.214.223.21", "208.85.150.188", "208.85.150.177"
      ],
      goodIp = trackerIps[0],
      req;

  beforeEach(function () {
    testHelpers.stubLogging(handlers);

    config = handlers.__get__("config");
    sandbox = sinon.sandbox.create();
    res = { send: sandbox.stub() };
    next = sandbox.stub();
    mitm = mitmFactory();

    req = {
      connection: { remoteAddress: goodIp },
      header: function () {
        return null;
      }
    };
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
    describe("succeeds and", function () {
      afterEach(function () {
        next.calledOnce.should.be.true;
        res.send.calledOnce.should.be.true;
        res.send.firstCall.args[0].should.equal(200);
      });

      it("accepts but ignores activity we don't care about", function () {
        req.body = loadJsonFixture("trackerWebhookTaskEdit");
        handlers.fromtracker(req, res, next);
      });

      it("sends label updates to GH when linked story in Tracker changes state", function (done) {
        var trackerStoryResponse = loadJsonFile("trackerLinkedStoryResponse"),
            issueGetResponse = loadJsonFile("githubIssueGetResponse"),
            projectId = 1286564,
            storyId = 89146028,
            issueNumber = 2;

        req.body = loadJsonFixture("trackerWebhookLinkedStoryStarted");
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

    describe("fails POSTs that don't originate from an actual Tracker IP address", function () {
      var badIp = "192.168.10.200";

      beforeEach(function () {
        req.body = loadJsonFixture("trackerWebhookLinkedStoryStarted");
      });

      function doTest() {
        handlers.fromtracker(req, res, next);

        next.calledOnce.should.be.true;
        res.send.calledOnce.should.be.true;
        res.send.firstCall.args[0].should.equal(403);
      }

      it("when IP address is in x-forwarded-for", function () {
        req.header = function (key) {
          return (key === "x-forwarded-for") ? badIp : null;
        };
        doTest();
      });

      it("when IP addrss is in the net connection object", function () {
        req.connection.remoteAddress = badIp;
        doTest();
      });
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
