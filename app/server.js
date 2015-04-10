var config = require("environmental").config(),
    restify = require("restify"),
    helpers = require("./helpers"),
    handlers = require("./handlers");

function launch() {
  var port =  process.env.VCAP_APP_PORT || config.server.port || 8001,
      server = restify.createServer({
        name: "trissues",
        version: "0.0.0",
        formatters: {
          "application/xml": function (req, res, body) {
            return body;
          }
        }
      });

  server.use(restify.bodyParser());
  server.get("/githubissues", handlers.githubissues);
  server.post("/fromtracker", handlers.fromtracker);
  server.post("/fromgithub", handlers.fromgithub);
  server.listen(parseInt(port));
  helpers.log("Server running at http://127.0.0.1:" + port + "/  (" + process.env.NODE_ENV + " mode)");
}

module.exports = { launch: launch };
