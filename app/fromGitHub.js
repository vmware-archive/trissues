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
        qualifiedProject = tracker.project(config.tracker.projectid),
        searcher = Promise.promisify(qualifiedProject.search, qualifiedProject),
        promise = searcher("external_id:"+issueId);

    promises.push(promise);
    promise.then(function(result) {
      // {epics:[], stories:[Object]}
      console.log("Label from webhook: ", webhook.label.name);
      console.log(result.stories[0].labels);
      // { labels: [{name: 'new name'}]}
    });
  },

  finishRequest: function (promises, res, next) {
    if (promises.length === 0) {
      promises.push(Promise.resolve());
    }
    Promise.settle(promises).then(function () {
      // helpers.log("    sending response with status 200");
      res.send(200);
      return next();
    });
  }
};

module.exports = fromGitHub;
