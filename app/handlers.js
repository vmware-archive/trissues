var restify = require("restify"),
    config = require("environmental").config(),
    exports = {
      githubissues: function (req, res, next) {
        var client = restify.createJsonClient({
          url: "https://api.github.com/",
          headers: {
            Authorization: "token " + config.auth.github
          }
        });
        client.get("/repos/" + config.github.repo + "/issues", function (err, githubReq, githubRes, issues) {
          var xmlResponse = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><external_stories type=\"array\">";

          issues.forEach(function (issue) {
            xmlResponse += "<external_story>"
              + "<external_id>" + issue.number + "</external_id>"
              + "<story_type>feature</story_type>"
              + "<name>" + issue.title + "</name>"
              + "<requested_by>" + issue.user.login + "</requested_by>"
              + "<created_at type=\"datetime\">" + issue.created_at + "</created_at>";

            if ((issue.body || "") !== "") {
              xmlResponse += "<description>" + issue.body + "</description>";
            }

            if (issue.assignee) {
              xmlResponse += "<owned_by>" + issue.assignee.login + "</owned_by>";
            }

            xmlResponse += "</external_story>";
          });

          xmlResponse += "</external_stories>";

          res.contentType = "application/xml";
          res.send(200, xmlResponse);
          return next();
        });
      }
    };

module.exports = exports;
