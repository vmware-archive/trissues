/*globals describe, it, beforeEach, afterEach, rewireInApp */
/*jshint expr:true*/

require("should");
var sinon = require("sinon"),
    fs = require("fs"),
    //environmental = require("environmental"),

// code under test
    handlers = rewireInApp("handlers"),

    //Something useful
    sandbox,
    res = { send: sinon.stub() },
    next = sinon.stub(),
    jsonResponse = fs.readFileSync(__dirname+"/../fixtures/json/githubIssuesResponse.json", { encoding: "utf8" }),
    xmlResponse = fs.readFileSync(__dirname+"/../fixtures/xml/fixtureResponse.xml", { encoding: "utf8" });


describe("handlers", function () {
  beforeEach(function () {
    sandbox = sinon.sandbox.create();
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
  });
});
