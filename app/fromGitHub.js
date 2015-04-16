var Promise = require("bluebird"),
    Client = require("pivotaltracker").Client,
    helpers = require("./helpers"),
    trackerStateNames = [
      "unscheduled", "unstarted", "started", "finished",
      "delivered", "rejectd", "accepted"
    ],
    fromGitHub,
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

  isIssueWithLabelChange: function (webhook) {
    return webhook && (webhook.action === "labeled"); //|| webhook.action === "unlabeled";
  },

  updateStoryLabelsInTracker: function (webhook) {
    var newLabel = webhook.label.name,
        issueId = webhook.issue.number;
    helpers.log("    added label '" + newLabel + "' to GitHub Issue #" + issueId);
    if (trackerStateNames.indexOf(newLabel) > -1) {
      helpers.log("    skipping state label");
      return Promise.resolve();
    }

    var qualifiedProject = tracker.project(config.tracker.projectid),
        searcher = Promise.promisify(qualifiedProject.search, qualifiedProject),
        projectSearchPromise = searcher("external_id:"+issueId),
        wereDonePromise = helpers.emptyPromise();

    projectSearchPromise.then(function (result) {
      var storyHash = result.stories[0],
          storyId = storyHash.id,
          alreadyThere = storyHash.labels.some(function (labelHash) {
            return labelHash.name === newLabel;
          });

      helpers.log("    for GH issue " + issueId + ", the Tracker story is #" + storyId);
      if (!alreadyThere) {
        var qualifiedStory =
                tracker.project(config.tracker.projectid).story(storyId),
            updater = Promise.promisify(qualifiedStory.update, qualifiedStory);

        storyHash.labels.push({ name: newLabel });

        var newInfo = {
              labels: storyHash.labels
            };
        helpers.log("    updating Tracker story #" + storyId + " with revised label hashes " + newInfo);
        wereDonePromise.resolve(updater(newInfo));
      } else {
        helpers.log("    skipping existing label");
        wereDonePromise.resolve();
      }
    }).catch(function (e) {
      helpers.log(e);
    });

    return wereDonePromise;
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
