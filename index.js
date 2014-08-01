var es = require('event-stream');
var ngDep = require('ng-dependencies');
var toposort = require('toposort');

var ANGULAR_MODULE = 'ng';

module.exports = function angularFilesort () {
  var files = [];
  var angmods = {};
  var toSort = [];

  return es.through(function collectFilesToSort (file) {
      var deps = ngDep(file.contents);

      if (deps.modules) {
        // Store references to each file with a declaration:
        Object.keys(deps.modules).forEach(function (name) {
          angmods[name] = file;
        });
      }

      if (deps.dependencies) {
        // Add each file with dependencies to the array to sort:
        deps.dependencies.forEach(function (dep) {
          if (deps.modules && dep in deps.modules){
            return;
          }
          if (dep === ANGULAR_MODULE) {
            return;
          }
          toSort.push([file, dep]);
        });
      }

      // Collect all files:
      files.push(file);

    }, function afterFileCollection () {
      // Convert all module names to actual files with declarations:
      for (var i = 0; i < toSort.length; i++) {
        var moduleName = toSort[i][1];
        var declarationFile = angmods[moduleName];
        if (declarationFile) {
          toSort[i][1] = declarationFile;
        } else {
          // Depending on module outside stream (possibly a 3rd party one),
          // don't care when sorting:
          toSort.splice(i--, 1);
        }
      }

      // Sort `files` with `toSort` as dependency tree:
      toposort.array(files, toSort)
        .reverse()
        .forEach(function (file) {
          this.emit('data', file);
        }.bind(this));

      this.emit('end');
    });
};
