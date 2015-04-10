var fromGitHub,
    Promise = require("bluebird"),
    Client = require("pivotaltracker").Client,
    tracker,
    config;

fromGitHub = {
  setConfig: function (initialConfig) {
    config = initialConfig;
    tracker = new Client({
      trackerToken: config.auth.tracker,
      pivotalHost: (config.tracker && config.tracker.host) || "www.pivotaltracker.com"
    });
  },

  isIssueWithLabelChange: function (promises, webhook) {
    return webhook.action === "labeled" || webhook.action === "unlabeled";
  },

  updateStoryLabelsInTracker: function (promises, webhook) {
    var issueId = webhook.issue.number,
        newLabel = webhook.label.name,
        qualifiedProject = tracker.project(config.tracker.projectid),
        searcher = Promise.promisify(qualifiedProject.search, qualifiedProject),
        promise = searcher("external_id:"+issueId);
    promises.push(promise);

    promise.then(function (result) {
      var storyId = result.stories[0].id,
          qualifiedStory =
              tracker.project(config.tracker.projectid).story(storyId),
          updater = Promise.promisify(qualifiedStory.update, qualifiedStory),
          newInfo = {
            labels: [{ name: newLabel }]
          },
          promise = updater(newInfo);
      promises.push(promise);
      return promise;
    })
.then(function () { console.log(arguments); })
;
  },

  finishRequest: function (promises, res, next) {
    if (promises.length === 0) {
      promises.push(Promise.resolve());
    }
    Promise.settle(promises).then(function () {
      res.send(200);
      return next();
    });
  }
};

module.exports = fromGitHub;
