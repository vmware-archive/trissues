/*globals describe, it, beforeEach, afterEach, rewireInApp */
/*jshint expr:true*/


var should = require("should"),
    sinon = require("sinon"),
    fs = require("fs"),
    parseXml = require("xml2js").parseString,
    //environmental = require("environmental"),

    // code under test
    handlers = rewireInApp("handlers"),

    //Something useful
    sandbox,
    res,
    next,
    jsonResponse = fs.readFileSync(__dirname+"/../fixtures/json/githubIssuesResponse.json", { encoding: "utf8" }),
    xmlResponse = fs.readFileSync(__dirname+"/../fixtures/xml/fixtureResponse.xml", { encoding: "utf8" });


describe("handlers", function () {
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    res = { send: sandbox.stub() };
    next = sandbox.stub();
  });
  afterEach(function () {
    sandbox.restore();
  });

  describe("githubissues", function () {
    it("returns fixture stories", function () {
      var restify = handlers.__get__("restify"),
          createJsonClientStub = sandbox.stub(restify, "createJsonClient"),
          mockClient = { get: function () {} };

      sandbox.stub(mockClient, "get", function (url, callback) {
        url.should.be.equal("/repos/pivotaltracker/trissues/issues");
        callback(null, {}, {}, JSON.parse(jsonResponse));
      });
      createJsonClientStub.returns(mockClient);

      handlers.githubissues(null, res, next);

      res.send.calledOnce.should.be.true;
      res.send.firstCall.args[0].should.equal(200);
      res.send.firstCall.args[1].replace(/\s+/g, "").should.equal(xmlResponse.replace(/\s+/g, ""));
      next.calledOnce.should.be.true;
    });

    it("can filter out specified label", function () {
      // I wanted to combine the setup here into a before but couldn't get var scopes right.
      var restify = handlers.__get__("restify"),
          config = handlers.__get__("config"),
      createJsonClientStub = sandbox.stub(restify, "createJsonClient"),
      mockClient = { get: function () {} };

      config.filteredlabels = "feature";

      sandbox.stub(mockClient, "get", function (url, callback) {
        url.should.be.equal("/repos/pivotaltracker/trissues/issues");
        callback(null, {}, {}, JSON.parse(jsonResponse));
      });
      createJsonClientStub.returns(mockClient);

      handlers.githubissues(null, res, next);
      res.send.calledOnce.should.be.true;

      var numbersOnly;
      parseXml(res.send.firstCall.args[1], function (err, result) {
        numbersOnly = result.external_stories.external_story.map(function (story) {
          return parseInt(story.external_id[0]);
        });
      });
      numbersOnly.should.be.eql([1]);
      next.calledOnce.should.be.true;
    });

    it("can filter out multiple specified labels", function () {
      var restify = handlers.__get__("restify"),
      config = handlers.__get__("config"),
      createJsonClientStub = sandbox.stub(restify, "createJsonClient"),
      mockClient = { get: function () {} };

      config.filteredlabels = "feature, low-priority";

      sandbox.stub(mockClient, "get", function (url, callback) {
        url.should.be.equal("/repos/pivotaltracker/trissues/issues");
        callback(null, {}, {}, JSON.parse(jsonResponse));
      });
      createJsonClientStub.returns(mockClient);

      handlers.githubissues(null, res, next);
      res.send.calledOnce.should.be.true;

      var externalStories = {};
      parseXml(res.send.firstCall.args[1], function (err, result) {
        externalStories = result.external_stories;
      });

      should.not.exist(externalStories.externalStory);
      next.calledOnce.should.be.true;
    });
  });
});
