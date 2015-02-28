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
  }
};

module.exports = fromGitHub;
