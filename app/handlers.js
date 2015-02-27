var restify = require("restify"),
    Promise = require("bluebird"),
    config = require("environmental").config(),
    xml = require("xml"),
    Client = require("pivotaltracker").Client,
    tracker = new Client(config.auth.tracker),
    fromTracker = require("./fromTracker");

module.exports = {
  githubissues: function (req, res, next) {
    var client = restify.createJsonClient({
      url: "https://api.github.com/",
      headers: {
        Authorization: "token " + config.auth.github
      }
    }),
    filteredLabels = (function () {
      if (config.exclude && config.exclude.labels) {
        return config.exclude.labels.split(/, */);
      } else {
        return [];
      }
    }());
    client.get("/repos/" + config.github.repo + "/issues", function (err, githubReq, githubRes, issues) {
      var responseObj = {
        external_stories: [{ _attr: { type: "array" } }]
      };

      issues.forEach(function (issue) {
        if (!issue.labels.some(
          function (label) {
            return filteredLabels.indexOf(label.name) !== -1;
          })) {
          var externalStory = [
            { external_id: issue.number },
            { story_type: "feature" },
            { name: issue.title },
            { requested_by: issue.user.login },
            { created_at: [{ _attr:{ type: "datetime" } }, issue.created_at] }
          ];

          if ((issue.body || "") !== "") {
            externalStory.push({ description: issue.body });
          }

          if (issue.assignee) {
            externalStory.push({ owned_by: issue.assignee.login });
          }
          responseObj.external_stories.push({ external_story: externalStory });
        }
      });

      res.contentType = "application/xml";
      res.send(200, xml(responseObj, { declaration: true }));
      return next();
    });
  },

  fromtracker: function (req, res, next) {
    var promises = [],
        activity = req.body;
    fromTracker.setConfig(config);
    activity.changes.forEach(function (changeHash) {
      if (fromTracker.isStoryWithStateChange(promises, changeHash)) {
        fromTracker.updateStateLabelsInGitHub(promises, activity, changeHash);
      }
    });

    fromTracker.finishRequest(promises, res, next);
  }
};
