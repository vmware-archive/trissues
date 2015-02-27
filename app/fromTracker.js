var fromTracker,
    Promise = require("bluebird"),
    octonode = require("octonode"),
    Client = require("pivotaltracker").Client,
    tracker,
    config;


fromTracker = {
  setConfig: function (initialConfig) {
    config = initialConfig;
    tracker = new Client(config.auth.tracker);
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
          if (story.integrationId === config.tracker.integrationid) {
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

          issue.update({labels: newLabelNames}, function() {
          });
        });
  },


  finishRequest: function(promises, res, next) {
    if (promises.length === 0) {
      promises.push(Promise.resolve());
    }
    Promise.settle(promises).then(function() {
      res.send(200);
      return next();
    });
  }
};

module.exports = fromTracker;
