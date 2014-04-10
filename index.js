var es = require('event-stream');
var esprima = require('esprima');
var estraverse  = require('estraverse');
var ngDep = require('ng-dependencies');

module.exports = function angularFilesort () {
  var files = [];
  var angmods = {};
  var indexCache = {};

  return es.through(function (file) {
      var deps = ngDep(file.contents);

      for (var i = 0; i < deps.length; i++) {
        var d = deps[i];
        d.file = file;
        if (typeof d.name !== 'undefined') {
          angmods[d.name] = d;
        } else {
          files.push(d);
        }
      }
    }, function () {
      var sorter = sortIndex.bind(null, indexCache, angmods);

      files.sort(function (a, b) {
        var aIndex = sorter(a),
            bIndex = sorter(b);

        if (aIndex === bIndex) {
          return a.file.relative.localeCompare(b.file.relative);
        }
        return aIndex - bIndex;
      })
      .forEach(function (obj) {
        this.emit('data', obj.file);
      }.bind(this));

      this.emit('end');
    });
};

function sortIndex (cache, angmods, obj) {
  if (typeof cache[obj.file.relative] !== 'undefined') {
    return cache[obj.file.relative];
  }
  var index = 0;
  if (obj.uses.length) {
    for (var i = 0; i < obj.uses.length; i++) {
      var mod = angmods[obj.uses[i]];
      if (!mod) {
        continue;
      }
      var modIndex = sortIndex(cache, angmods, mod);
      if (modIndex + 1 > index) {
        index = modIndex + 1;
      }
    }
  }
  return cache[obj.file.relative] = index;
}
