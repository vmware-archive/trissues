/*globals describe, it, beforeEach, afterEach, rewireInApp */
/*jshint expr:true*/


var should = require("should"),
    sinon = require("sinon"),
    fs = require("fs"),
    mitm = require("mitm")(),
    parseXml = require("xml2js").parseString,

    // code under test
    handlers = rewireInApp("handlers"),

    config, sandbox, res, next;


describe("handlers", function () {
  beforeEach(function () {
    config = handlers.__get__("config");
    sandbox = sinon.sandbox.create();
    res = { send: sandbox.stub() };
    next = sandbox.stub();
  });
  afterEach(function () {
    sandbox.restore();
  });

  describe("githubissues", function () {
    var jsonResponse = fs.readFileSync(__dirname+"/../fixtures/json/githubIssuesResponse.json", { encoding: "utf8" }),
        xmlResponse = fs.readFileSync(__dirname+"/../fixtures/xml/fixtureResponse.xml", { encoding: "utf8" });

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
        getIssues(res, done, function () { gotIssues([1]); });
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

  describe("fromtracker", function () {
    afterEach(function () {
      next.calledOnce.should.be.true;
      res.send.calledOnce.should.be.true;
      res.send.firstCall.args[0].should.equal(200);
    });

    function loadJsonFixture(name) {
      return JSON.parse(fs.readFileSync(__dirname+"/../fixtures/json/" + name + ".json", { encoding: "utf8" }));
    }

    it("accepts but ignores activity we don't care about", function () {
      var req = { body: loadJsonFixture("trackerWebhookTaskEdit") };
      handlers.fromtracker(req, res, next);
    });

    // it("sends label updates to GH when linked story in Tracker changes state", function (done) {
    //   var req = { body: loadJsonFixture("trackerWebhookLinkedStoryStarted") },
    //       githubResponse = loadJsonFixture("githubLabelUpdateResponse");
    //
    //   mitm.on("request", function(req, res) {
    //     req.method.should.equal("SOMETHING");
    //     req.url.should.equal("/repos/pivotaltracker/trissues/FIXME");
    //     throw "also assert thebo"
    //     res.statusCode = 200;
    //     res.end(githubResponse);
    //   });
    //
    //   next = function () {
    //     res.send.calledOnce.should.be.true;
    //     res.send.firstCall.args[0].should.equal(200);
    //
    //     done();
    //   };
    //   handlers.fromtracker(req, res, next);
    // });

    // it("doesn't contact GH on unlinked story state changes", function () {
    //
    // });
  });
});
