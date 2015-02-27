var restify = require("restify"),
    config = require("environmental").config(),
    xml = require("xml"),
    octonode = require("octonode"),
    tracker = new require("pivotaltracker").Client(config.auth.tracker);

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
    var activity = req.body;
    activity.changes.forEach(function (changeHash) {
      if (changeHash.kind === "story") {
console.log("Have a changed story");
        var projectId = activity.project.id,
        storyId = changeHash.id;
        tracker.project(projectId).story(storyId).get(function (error, story) {
console.log(story.integration_id, config.tracker.integrationid);
console.log(story.integration_id === config.tracker.integrationid);
if (story.integration_id === config.tracker.integrationid) {
console.log("integration_id matches");
            var github = octonode.client(config.auth.github),
            issue = github.issue(config.github.repo, story.external_id);

            issue.info(function (err, issueHash) {
console.log("ISSUE HASH!");
console.log(issueHash);
              var labelToAdd = changeHash.new_values.current_state,
              labelToRemove = changeHash.original_values.current_state,
              newLabelNames = [],
              labelNames = issueHash.labels.map(function (labelObj) { return labelObj.name; });
              newLabelNames = labelNames.filter(function (label) { return label !== labelToRemove; });
              newLabelNames.push(labelToAdd);

console.log("update with: ", newLabelNames);
              issue.update({ labels: newLabelNames }, function () {
console.log("UPDATED!");
                finishRequest(res, next);
              });
            });
          }
        });
      }
    });

    finishRequest(res, next);
  }
};
