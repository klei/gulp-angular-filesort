var es = require('event-stream');
var esprima = require('esprima');
var estraverse  = require('estraverse');

module.exports = function angularFilesort () {
  var files = [];
  var angmods = {};
  var indexCache = {};

  return es.through(function (file) {
      var declared = [],
          used = [];

      estraverse.traverse(esprima.parse(file.contents), {
        leave: function (node, parent) {
          if (!isAngularModuleStatement(node)) {
            return;
          }
          var moduleName = parent.arguments[0].value;
          if (parent.arguments[1]) {
            if (declared.indexOf(moduleName) < 0) {
              declared.push(moduleName);
              if (used.indexOf(moduleName) > -1) {
                used.splice(used.indexOf(moduleName), 1);
              }
            }
            parent.arguments[1].elements.forEach(function (el) {
              if (used.indexOf(el.value) < 0) {
                used.push(el.value);
              }
            });
          } else if (declared.indexOf(moduleName) < 0 && used.indexOf(moduleName) < 0) {
            used.push(moduleName);
          }
        }
      });

      for (var d = 0; d < declared.length; d++) {
        angmods[declared[d]] = {
          file: file,
          name: declared[d],
          uses: used
        };
      }

      files.push({file: file, uses: used});
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

function isAngularModuleStatement (node) {
  return node.type === 'MemberExpression' && node.object.name === 'angular' && node.property.name === 'module';
}

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
