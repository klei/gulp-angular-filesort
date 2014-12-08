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
      fixture(path.join('fixtures', 'another-factory.js')),
      fixture(path.join('fixtures', 'another.js')),
      fixture(path.join('fixtures', 'module-controller.js')),
      fixture(path.join('fixtures', 'no-deps.js')),
      fixture(path.join('fixtures', 'module.js')),
      fixture(path.join('fixtures', 'dep-on-non-declared.js')),
      fixture(path.join('fixtures', 'yet-another.js'))
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
      resultFiles.length.should.equal(7);
      resultFiles.indexOf(path.join('fixtures', 'module-controller.js')).should.be.above(resultFiles.indexOf(path.join('fixtures', 'module.js')));
      resultFiles.indexOf(path.join('fixtures', 'yet-another.js')).should.be.above(resultFiles.indexOf(path.join('fixtures', 'another.js')));
      resultFiles.indexOf(path.join('fixtures', 'another-factory.js')).should.be.above(resultFiles.indexOf(path.join('fixtures', 'another.js')));
      done();
    });

    files.forEach(function (file) {
      stream.write(file);
    });

    stream.end();
  });

  it('should not crash when a module is both declared and used in the same file (Issue #5)', function (done) {
    var files = [
      fixture(path.join('fixtures', 'circular.js'))
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
      resultFiles[0].should.equal(path.join('fixtures', 'circular.js'));
      should.not.exist(error);
      done();
    });

    files.forEach(function (file) {
      stream.write(file);
    });

    stream.end();
  });

  it('should not crash when a module is used inside a declaration even though it\'s before that module\'s declaration (Issue #7)', function (done) {
    var files = [
      fixture(path.join('fixtures', 'circular2.js')),
      fixture(path.join('fixtures', 'circular3.js'))
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
      resultFiles.length.should.equal(2);
      resultFiles.should.contain(path.join('fixtures', 'circular2.js'));
      resultFiles.should.contain(path.join('fixtures', 'circular3.js'));
      should.not.exist(error);
      done();
    });

    files.forEach(function (file) {
      stream.write(file);
    });

    stream.end();
  });

  it('should sort CoffeeScript and JavaScript', function (done) {
    var files = [
      fixture(path.join('fixtures', 'coffee-module.coffee')),
      fixture(path.join('fixtures', 'another-factory.js')),
      fixture(path.join('fixtures', 'module.js')),
      fixture(path.join('fixtures', 'yet-another.js')),
      fixture(path.join('fixtures', 'another.js'))
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
      resultFiles.length.should.equal(5);
      resultFiles.indexOf(path.join('fixtures', 'yet-another.js')).should.be.above(resultFiles.indexOf(path.join('fixtures', 'coffee-module.js')));
      resultFiles.indexOf(path.join('fixtures', 'yet-another.js')).should.be.above(resultFiles.indexOf(path.join('fixtures', 'another.js')));
      resultFiles.indexOf(path.join('fixtures', 'module.js')).should.be.above(resultFiles.indexOf(path.join('fixtures', 'another.js')));
      resultFiles.indexOf(path.join('fixtures', 'another-factory.js')).should.be.above(resultFiles.indexOf(path.join('fixtures', 'another.js')));
      done();
    });

    files.forEach(function (file) {
      stream.write(file);
    });

    stream.end();
  });
});
