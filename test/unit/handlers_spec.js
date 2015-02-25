/*globals describe, it, rewireInApp */
/*jshint expr:true*/

require("should");
var sinon = require("sinon"),
    fs = require("fs"),
    //environmental = require("environmental"),

// code under test
    handlers = rewireInApp("handlers"),

    //Something useful
    res = { send: sinon.stub() },
    next = sinon.stub(),
    xmlResponse = fs.readFileSync(__dirname+"/../fixtures/xml/fixtureResponse.xml", { encoding: "utf8" });


describe("handlers", function () {
  describe("githubissues", function () {
    it("returns something", function () {
      handlers.githubissues(null, res, next);
      res.send.calledOnce.should.be.true;
      res.send.firstCall.args[0].should.equal(200);
      res.send.firstCall.args[1].should.equal(xmlResponse);
      next.calledOnce.should.be.true;
    });
  });
});
