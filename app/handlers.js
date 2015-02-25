var fs = require("fs"),
    exports = {
      githubissues: function (req, res, next) {
        var xmlResponse = fs.readFileSync(__dirname+"/../test/fixtures/xml/fixtureResponse.xml", { encoding: "utf8" });

        res.contentType = "application/xml";
        res.send(200, xmlResponse);
        return next();
      }
    };

module.exports = exports;
