/*globals describe, it, beforeEach, afterEach, rewireInApp */
/*jshint expr:true*/

require("should");
var sinon = require("sinon"),
    environmental = require("environmental"),

// code under test
    server = rewireInApp("server");


describe("top-level server", function () {
  var handlerModule = server.__get__("handlers"),
      config,
      fakeServer,
      sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    config = server.__get__("config");
    fakeServer = { listen: sandbox.stub(), get: sandbox.stub(), post: sandbox.stub() };

    var restify = server.__get__("restify"),
        createStub = sandbox.stub(restify, "createServer");
    createStub.returns(fakeServer);
  });

  afterEach(function () {
    sandbox.restore();
    server.__set__("config", environmental.config());
  });

  it("creates an HTTP server and listens on the configured port", function () {
    config.server.port = "4242";

    server.launch();

    fakeServer.listen.calledOnce.should.be.true;
    fakeServer.listen.firstCall.calledWith(4242).should.be.true;
  });

  it("routes the GET /githubissues endpoing", function () {
    server.launch();

    fakeServer.get.calledOnce.should.be.true;
    fakeServer.get.firstCall.args[0].should.be.equal("/githubissues");
    fakeServer.get.firstCall.args[1].should.be.equal(handlerModule.githubissues);
  });
});
