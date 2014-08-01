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
      fixture('fixtures/no-deps.js'),
      fixture('fixtures/module.js'),
      fixture('fixtures/dep-on-non-declared.js'),
      fixture('fixtures/yet-another.js')
    ];

    var resultFiles = [];

    var stream = angularFilesort();

    stream.on('error', function(err) {
      should.exist(err);
      done(err);
    });

    stream.on('data', function (file) {
      resultFiles.push(file.relative);
    });

    stream.on('end', function () {
      resultFiles.length.should.equal(6);
      resultFiles.indexOf('fixtures/module-controller.js').should.be.above(resultFiles.indexOf('fixtures/module.js'));
      resultFiles.indexOf('fixtures/yet-another.js').should.be.above(resultFiles.indexOf('fixtures/module.js'));
      resultFiles.indexOf('fixtures/another.js').should.be.above(resultFiles.indexOf('fixtures/module.js'));
      resultFiles.indexOf('fixtures/another.js').should.be.above(resultFiles.indexOf('fixtures/yet-another.js'));
      done();
    });

    files.forEach(function (file) {
      stream.write(file);
    });

    stream.end();
  });

  it('should not crash when a module is both declared and used in the same file (Issue #5)', function (done) {
    var files = [
      fixture('fixtures/circular.js')
    ];

    var resultFiles = [];
    var error = null;

    var stream = angularFilesort();

    stream.on('error', function(err) {
      error = err;
    });

    stream.on('data', function (file) {
      resultFiles.push(file.relative);
    });

    stream.on('end', function () {
      resultFiles.length.should.equal(1);
      resultFiles[0].should.equal('fixtures/circular.js');
      should.not.exist(error);
      done();
    });

    files.forEach(function (file) {
      stream.write(file);
    });

    stream.end();
  });
});
