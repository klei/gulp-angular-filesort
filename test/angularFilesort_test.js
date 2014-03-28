/* jshint camelcase: false, strict: false */
/* global describe, it */
var chai = require('chai'),
    should = chai.should(),
    gutil = require('gulp-util'),
    fs = require('fs'),
    path = require('path'),
    angularFilesort = require('../.');

function fixture (file) {
  var filepath = path.join(__dirname, file);
  return new gutil.File({
    path: filepath,
    cwd: __dirname,
    base: __dirname,
    contents: fs.readFileSync(filepath)
  });
}

describe('gulp-angular-filesort', function () {
  it('should sort file with a module definition before files that uses it', function (done) {

    var files = [
      fixture('fixtures/another.js'),
      fixture('fixtures/module-controller.js'),
      fixture('fixtures/module.js')
    ];

    var resultFiles = [];

    var stream = angularFilesort();

    stream.on('error', function(err) {
      should.exist(err);
      done(err);
    });

    stream.on('data', function (file) {
      resultFiles.push(file);
    });

    stream.on('end', function () {
      resultFiles.length.should.equal(3);
      resultFiles[0].relative.should.equal('fixtures/module.js');
      resultFiles[1].relative.should.equal('fixtures/another.js');
      resultFiles[2].relative.should.equal('fixtures/module-controller.js');
      done();
    });

    files.forEach(function (file) {
      stream.write(file);
    });

    stream.end();
  });
});
