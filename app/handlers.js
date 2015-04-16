var restify = require("restify"),
    config = require("environmental").config(),
    xml = require("xml"),
    helpers = require("./helpers"),
    fromGitHub = require("./fromGitHub"),
    fromTracker = require("./fromTracker");

module.exports = {
  githubissues: function (req, res, next) {
    helpers.log("GET request for importable stories through /githubissues");
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
      helpers.log("    Received " + issues.length + " issues from GitHub");

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
      helpers.log("    Responding with " + responseObj.external_stories.length + " Tracker external stories");
      return next();
    });
  },

  fromgithub: function (req, res, next) {
    helpers.log("POST request to /fromgithub");

    var promises = [],
        webhook = req.body;
    fromGitHub.setConfig(config);
    if (fromGitHub.isIssueWithLabelChange(webhook)) {
      var p = fromGitHub.updateStoryLabelsInTracker(webhook);
      promises.push(p);
    }
    fromGitHub.finishRequest(promises, res, next);
  },

  fromtracker: function (req, res, next) {
    helpers.log("POST request to /fromtracker");

    var promises = [],
        activity = req.body;
    fromTracker.setConfig(config);

    helpers.log("    Tracker activity item contains " + activity.changes.length + " resource changes");
    activity.changes.forEach(function (changeHash) {
      if (fromTracker.isStoryWithStateChange(promises, changeHash)) {
        helpers.log("   state change to story " + changeHash.id);
        fromTracker.updateStateLabelsInGitHub(promises, activity, changeHash);
      }
    });

    fromTracker.finishRequest(promises, res, next);
  }
};
