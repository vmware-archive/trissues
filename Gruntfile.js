var _ = require("lodash"),
    path = require("path");

function requireComponent(componentName) {
  return require("./" + path.join("build_components", "grunt", componentName));
}

function configureGrunt(grunt) {
  require("matchdep").filterDev(["grunt-*", "!grunt-cli"]).forEach(grunt.loadNpmTasks);

  var configuration = {};
  _.merge(configuration, requireComponent("install")(grunt));
  _.merge(configuration, require("quick-grunt-config-coding-conventions")(grunt, ["build_components"]));
  _.merge(configuration, require("quick-grunt-config-mocha-sauce")(grunt));
  _.merge(configuration, requireComponent("tests")(grunt));   // extra config/tasks to go with ...-mocha-sauce

  grunt.registerTask("unit", "alias for 'test-unit'", ["test-unit"]);
  grunt.registerTask("validate", "run all the checks and tests",
      [
        "jshint", "jscs",                  // from quick-grunt-config-coding-standards
        "test-unit", "test-integration"    // from quick-grunt-config-mocha-sauce
      ]);

  grunt.registerTask("test", "ensure everything's installed and run tests",
      [
        "install",                         // from install
        "validate"
      ]);
  grunt.registerTask("default", "run 'test' task by default", ["test"]);

  grunt.initConfig(configuration);
}

// Export the configuration
module.exports = configureGrunt;
