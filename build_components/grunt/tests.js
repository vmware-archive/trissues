function loadTestTasks(grunt) {
  grunt.registerTask("test-external", "run external integration API tests (mocha)",
      ["environmental:test", "mochacli:external"]);

  return {
    mochacli: {
      external: { options: { filesRaw: [
        "test/external/**/*_spec.js"
      ] } }
    },
    express: {
      "test-server": {
        options: {
          script: "index.js",
          output: "Server running at",
          logs: {
            out: "logs/test_server_stdout.log",
            err: "logs/test_server_stderr.log"
          }
        }
      }
    }
  };
}

module.exports = loadTestTasks;
