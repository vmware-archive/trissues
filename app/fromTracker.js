var fromTracker,
    Promise = require("bluebird"),
    octonode = require("octonode"),
    Client = require("pivotaltracker").Client,
    tracker,
    config;


fromTracker = {
  setConfig: function (initialConfig) {
    config = initialConfig;
    tracker = new Client({
      trackerToken: config.auth.tracker,
      pivotalHost: config.tracker.host || "www.pivotaltracker.com"
    });
    fromTracker.initialConfig = initialConfig;
  },

  isStoryWithStateChange: function (promises, changeHash) {
    return changeHash.kind === "story" &&
        (changeHash.new_values.current_state || changeHash.original_values.current_state);
  },

  updateStateLabelsInGitHub: function (promises, activity, changeHash) {
    var projectId = activity.project.id,
        storyId = changeHash.id;

    var qualifiedStory = tracker.project(projectId).story(storyId),
        getter = Promise.promisify(qualifiedStory.get, qualifiedStory),
        promise = getter(),
        issue;

    promises.push(promise);
    promise.
        then(function(story) {
          console.log("    Story integration id: " + story.integrationId + " configured integration id: " + config.tracker.integrationid);

          if (story.integrationId === parseInt(config.tracker.integrationid)) {
            console.log("    story's integrationId matches our configuration");

            var github = octonode.client(config.auth.github);
            issue = github.issue(config.github.repo, story.externalId);

            var fetchInfo = Promise.promisify(issue.info, issue),
                promise = fetchInfo();
            promises.push(promise);
            return promise;
          }
          return Promise.reject("Operation unneeded");
        }).
        then(function(issues) {
          console.log("   Matching GitHub issue received");
          var issueHash = issues[0],
              labelToAdd = changeHash.new_values.current_state,
              labelToRemove = changeHash.original_values.current_state,
              labelNames = issueHash.labels.map(function(labelObj) {
                return labelObj.name;
              }),
              newLabelNames = labelNames.filter(function(label) {
                return label !== labelToRemove;
              });
          newLabelNames.push(labelToAdd);

          console.log("    original Issue lables were " + labelNames + ", changing to " + newLabelNames);
          issue.update({labels: newLabelNames}, function(error) {
            console.log("    uptade to GitHub " + (error === null ? "succeeded" : "failed"));
          });
        });
  },


  finishRequest: function(promises, res, next) {
    if (promises.length === 0) {
      promises.push(Promise.resolve());
    }
    Promise.settle(promises).then(function() {
      console.log("    sending resonse with status 200");
      res.send(200);
      return next();
    });
  }
};

module.exports = fromTracker;
