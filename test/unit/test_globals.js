var path = require("path"),
    fs = require("fs"),
    rewire = require("rewire");

/*global rewireInApp: true */
rewireInApp = function (appRelativePath) {
  return rewire(path.join(__dirname, "..", "..", "app", appRelativePath));
};

/*global loadJsonFile: true */
loadJsonFile = function (name) {
  return fs.readFileSync(__dirname+"/../fixtures/json/" + name + ".json", { encoding: "utf8" });
};

/*global loadJsonFixture: true */
loadJsonFixture = function (name) {
  return JSON.parse(loadJsonFile(name));
};
