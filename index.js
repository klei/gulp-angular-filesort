var es = require('event-stream');
var esprima = require('esprima');
var estraverse  = require('estraverse');

module.exports = function angularFilesort () {
  var files = [];
  var angmods = {};
  return es.through(function (file) {
      // console.log(file.path);
      var declared = [],
          used = [];
      estraverse.traverse(esprima.parse(file.contents), {
        leave: function (node, parent) {
          if (node.type !== 'MemberExpression' || node.object.name !== 'angular' || node.property.name !== 'module') {
            return;
          }
          var name = parent.arguments[0].value;
          if (parent.arguments[1]) {
            if (declared.indexOf(name) < 0) {
              declared.push(name);
              if (used.indexOf(name) > -1) {
                used.splice(used.indexOf(name), 1);
              }
            }
            parent.arguments[1].elements.forEach(function (el) {
              if (used.indexOf(el.value) < 0) {
                used.push(el.value);
              }
            });
          } else if (declared.indexOf(name) < 0 && used.indexOf(name) < 0) {
            used.push(name);
          }
        }
      });
      for (var d = 0; d < declared.length; d++) {
        if (angmods[declared[d]]) {
          return this.emit('error', new Error('Module "' + declared[d] + '" in `' + file.relative + '`was already declared in `' + angmods[declared[d]].file.relative + '`'));
        }
        angmods[declared[d]] = {
          file: file,
          name: declared[d],
          uses: used
        };
      }
      files.push({file: file, uses: used});
    }, function () {
      var sorter = sortIndex.bind(null, angmods);
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

var indexCache = {};
function sortIndex (angmods, obj) {
  if (typeof indexCache[obj.file.relative] !== 'undefined') {
    return indexCache[obj.file.relative];
  }
  var index = 0;
  if (obj.uses.length) {
    for (var i = 0; i < obj.uses.length; i++) {
      var mod = angmods[obj.uses[i]];
      if (!mod) {
        continue;
      }
      var modIndex = sortIndex(angmods, mod);
      if (modIndex + 1 > index) {
        index = modIndex + 1;
      }
    }
  }
  return indexCache[obj.file.relative] = index;
}
