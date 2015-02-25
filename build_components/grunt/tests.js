function loadTestTasks() {
  return {
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
