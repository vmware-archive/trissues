var config = require("environmental").config(),
    restify = require("restify"),
    handlers = require("./handlers.js");

function launch() {
  var port = parseInt(config.server.port) || 8001,
      server = restify.createServer({
        name: "trissues",
        version: "0.0.0",
        formatters: {
          "application/xml": function (req, res, body) {
            return body;
          }
        }
      });

  server.get("/githubissues", handlers.githubissues);
  server.listen(port);
  console.log("Server running at http://127.0.0.1:" + port + "/  (" + process.env.NODE_ENV + " mode)");
}

module.exports = { launch: launch };
