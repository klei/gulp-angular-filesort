var es = require('event-stream');
var ngDep = require('ng-dependencies');
var toposort = require('toposort');
var gutil = require('gulp-util');
var PluginError = gutil.PluginError;

var PLUGIN_NAME = 'gulp-angular-filesort';
var ANGULAR_MODULE = 'ng';

module.exports = function angularFilesort () {
  var files = [];
  var angmods = {};
  var toSort = [];

  return es.through(function collectFilesToSort (file) {
      var deps;
      try {
        deps = ngDep(file.contents);
      } catch (err) {
        return this.emit('error', new PluginError(PLUGIN_NAME, 'Error in parsing: "' + file.relative + '", ' + err.message));
      }

      if (deps.modules) {
        // Store references to each file with a declaration:
        Object.keys(deps.modules).forEach(function (name) {
          angmods[name] = file;
        });
      }

      if (deps.dependencies) {
        // Add each file with dependencies to the array to sort:
        deps.dependencies.forEach(function (dep) {
          if (isDependecyUsedInAnyDeclaration(dep, deps)) {
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

function isDependecyUsedInAnyDeclaration (dependency, ngDeps) {
  if (!ngDeps.modules) {
    return false;
  }
  if (dependency in ngDeps.modules) {
    return true;
  }
  return Object.keys(ngDeps.modules).any(function (module) {
    return ngDeps.modules[module].indexOf(dependency) > -1;
  });
}
