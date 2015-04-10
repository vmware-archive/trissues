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
      restify,
      sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
    config = server.__get__("config");
    fakeServer = {
      listen: sandbox.stub(),
      get: sandbox.stub(),
      post: sandbox.stub(),
      use: sandbox.stub()
    };

    restify = server.__get__("restify");
    var createStub = sandbox.stub(restify, "createServer");
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

  it("installs the standard bodyParser", function () {
    var knownBodyParser = restify.bodyParser();
    sandbox.stub(restify, "bodyParser");
    restify.bodyParser.returns(knownBodyParser);

    server.launch();

    fakeServer.use.calledOnce.should.be.true;
    fakeServer.use.firstCall.args[0].should.be.equal(knownBodyParser);
  });

  it("routes the GET /githubissues endpoint", function () {
    server.launch();

    fakeServer.get.calledOnce.should.be.true;
    fakeServer.get.firstCall.args[0].should.be.equal("/githubissues");
    fakeServer.get.firstCall.args[1].should.be.equal(handlerModule.githubissues);
  });

  it("routes the POST /fromtracker endpoint", function () {
    server.launch();

    fakeServer.post.firstCall.args[0].should.be.equal("/fromtracker");
    fakeServer.post.firstCall.args[1].should.be.equal(handlerModule.fromtracker);
  });

  it("routes the POST /fromgithub endpoint", function () {
    server.launch();

    fakeServer.post.secondCall.args[0].should.be.equal("/fromgithub");
    fakeServer.post.secondCall.args[1].should.be.equal(handlerModule.fromgithub);
  });
});
