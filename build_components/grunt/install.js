
function loadInstallTasks(grunt) {
  grunt.registerTask("install",
      "copy/create stuff between  source control and where they need to be to run tests",
      [
        "get-default-environment-configs",
        "ensure-logs-directory"
      ]);

  grunt.registerTask("get-default-environment-configs",
      "environment config info (read by the environmental NPM) needs to be in /envs to run, but canonical examples are kept in /test/fixtures/build_envs",
      ["shell:envs"]
  );

  grunt.registerTask("ensure-logs-directory",
      "the Express server used to test tsme as middleware is organized as a separate node package, so install its dependencies",
      ["shell:mkdir-logs"]
  );


  return {
    shell: {
      envs: {
        command: "mkdir -p envs && cp -a test/fixtures/build_envs/* envs/"
      },

      "mkdir-logs": {
        command: "mkdir -p logs"
      }
    }
  };
}

module.exports = loadInstallTasks;
