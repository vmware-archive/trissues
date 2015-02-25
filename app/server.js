var http = require("http"),
    config = require("environmental").config();

function launch() {
  var port = parseInt(config.server.port) || 8001,
      server = http.createServer(function (request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Hello World\n");
  });

  server.listen(port);
  console.log("Server running at http://127.0.0.1:" + port + "/  (" + process.env.NODE_ENV + " mode)");
}

module.exports = { launch: launch };
