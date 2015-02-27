var restify = require("restify"),
    config = require("environmental").config(),
    xml = require("xml"),
    octonode = require("octonode"),
    Client = require("pivotaltracker").Client,
    tracker = new Client(config.auth.tracker);

function finishRequest(res, next) {
  res.send(200);
  return next();
}

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
    var startedDeferredWork = false,
        activity = req.body;

    activity.changes.forEach(function (changeHash) {
      if (changeHash.kind === "story" &&
          (changeHash.new_values.current_state || changeHash.original_values.current_state)) {
        var projectId = activity.project.id,
        storyId = changeHash.id;

        startedDeferredWork = true;
        tracker.project(projectId).story(storyId).get(function (error, story) {
          if (story.integrationId === config.tracker.integrationid) {
            var github = octonode.client(config.auth.github),
            issue = github.issue(config.github.repo, story.externalId);

            issue.info(function (err, issueHash) {
              var labelToAdd = changeHash.new_values.current_state,
                  labelToRemove = changeHash.original_values.current_state,
                  labelNames = issueHash.labels.map(function (labelObj) { return labelObj.name; }),
                  newLabelNames = labelNames.filter(function (label) { return label !== labelToRemove; });
              newLabelNames.push(labelToAdd);

              issue.update({ labels: newLabelNames }, function () {
                finishRequest(res, next);
              });
            });
          } else {
            finishRequest(res, next);
          }
        });
      }
    });

    if (!startedDeferredWork) {
      finishRequest(res, next);
    }
  }
};
