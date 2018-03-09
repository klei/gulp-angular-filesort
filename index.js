'use strict';

var through = require('through2');
var ngDep = require('ng-dependencies');
var toposort = require('toposort');
var PluginError = require('plugin-error');

var PLUGIN_NAME = 'gulp-angular-filesort';
var ANGULAR_MODULE = 'ng';

module.exports = function angularFilesort() {
  var files = [];
  var ngModules = {};
  var toSort = [];

  function transformFunction(file, encoding, next) {

    // Fail on empty files
    if (file.isNull()) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'File: "' + file.relative + '" without content. You have to read it with gulp.src(..)'));
      return;
    }

    // Streams not supported
    if (file.isStream()) {
      /* jshint validthis:true */
      this.emit('error', new PluginError(PLUGIN_NAME, 'Streaming not supported'));
      next();
      return;
    }

    var deps;
    try {
      deps = ngDep(file.contents);
    } catch (err) {
      this.emit('error', new PluginError(PLUGIN_NAME, 'Error in parsing: "' + file.relative + '", ' + err.message));
      return;
    }

    if (deps.modules) {
      // Store references to each file with a declaration:
      Object.keys(deps.modules).forEach(function(name) {
        ngModules[name] = file;
      });
    }

    if (deps.dependencies) {
      // Add each file with dependencies to the array to sort:
      deps.dependencies.forEach(function(dep) {
        if (isDependecyUsedInAnyDeclaration(dep, deps)) {
          return;
        }
        if (dep === ANGULAR_MODULE) {
          return;
        }
        toSort.push([file, dep]);
      });
    }

    files.push(file);
    next();

  }

  function flushFunction(next) {

    // Convert all module names to actual files with declarations:
    for (var i = 0; i < toSort.length; i++) {
      var moduleName = toSort[i][1];
      var declarationFile = ngModules[moduleName];
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
      .forEach(function(file) {
        this.push(file);
      }.bind(this));

    next();
  }

  return through.obj(transformFunction, flushFunction);

};

function isDependecyUsedInAnyDeclaration(dependency, ngDeps) {
  if (!ngDeps.modules) {
    return false;
  }
  if (dependency in ngDeps.modules) {
    return true;
  }
  return Object.keys(ngDeps.modules).some(function(module) {
    return ngDeps.modules[module].indexOf(dependency) > -1;
  });
}
