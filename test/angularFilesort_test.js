/* jshint camelcase: false, strict: false */
/* global describe, it */
var chai = require('chai'),
  should = chai.should(),
  gutil = require('gulp-util'),
  fs = require('fs'),
  path = require('path'),
  angularFilesort = require('../.');

function fixture(file, config) {
  var filepath = path.join(__dirname, file);
  return new gutil.File({
    path: filepath,
    cwd: __dirname,
    base: __dirname,
    contents: config && config.withoutContents ? undefined : fs.readFileSync(filepath)
  });
}

function sort(files, checkResults, hadleError) {
  var resultFiles = [];

  var stream = angularFilesort();

  stream.on('error', function (err) {
    if (hadleError) {
      hadleError(err);
    } else {
      should.exist(err);
      done(err);
    }
  });

  stream.on('data', function (file) {
    resultFiles.push(file.relative);
  });

  stream.on('end', function () {
    checkResults(resultFiles);
  });

  files.forEach(function (file) {
    stream.write(file);
  });

  stream.end();
}

describe('gulp-angular-filesort', function () {
  it('should sort file with a module definition before files that uses it', function (done) {

    var files = [
      fixture('fixtures/another-factory.js'),
      fixture('fixtures/another.js'),
      fixture('fixtures/module-controller.js'),
      fixture('fixtures/no-deps.js'),
      fixture('fixtures/module.js'),
      fixture('fixtures/dep-on-non-declared.js'),
      fixture('fixtures/yet-another.js')
    ];

    sort(files, function (resultFiles) {
      resultFiles.length.should.equal(7);
      resultFiles.indexOf('fixtures/module-controller.js').should.be.above(resultFiles.indexOf('fixtures/module.js'));
      resultFiles.indexOf('fixtures/yet-another.js').should.be.above(resultFiles.indexOf('fixtures/another.js'));
      resultFiles.indexOf('fixtures/another-factory.js').should.be.above(resultFiles.indexOf('fixtures/another.js'));
      done();
    })

  });

  it('should sort the same set of files the same way independently of the order they are sent', function (done) {

    var files = [
      fixture('fixtures/another-factory.js'),
      fixture('fixtures/another.js'),
      fixture('fixtures/module-controller.js'),
      fixture('fixtures/no-deps.js'),
      fixture('fixtures/module.js'),
      fixture('fixtures/dep-on-non-declared.js'),
      fixture('fixtures/yet-another.js')
    ];

    sort(files, function (resultFiles) {
      resultFiles.length.should.equal(7);
      files.reverse();
      sort(files, function (resultFiles2) {
        resultFiles2.length.should.equal(7);
        resultFiles2.should.deep.equal(resultFiles);
        done();
      })
    })

  });

  it('should not crash when a module is both declared and used in the same file (Issue #5)', function (done) {
    var files = [
      fixture('fixtures/circular.js')
    ];

    sort(files, function (resultFiles) {
      resultFiles.length.should.equal(1);
      resultFiles[0].should.equal('fixtures/circular.js');
      done();
    })

  });

  it('should not crash when a module is used inside a declaration even though it\'s before that module\'s declaration (Issue #7)', function (done) {
    var files = [
      fixture('fixtures/circular2.js'),
      fixture('fixtures/circular3.js')
    ];

    sort(files, function (resultFiles) {
      resultFiles.length.should.equal(2);
      resultFiles.should.contain('fixtures/circular2.js');
      resultFiles.should.contain('fixtures/circular3.js');
      done();
    })

  });

  it('fails for not read file', function (done) {
    var files = [
      fixture('fake.js', {withoutContents: true})
    ];

    sort(files, function () {
    }, function (err) {
      should.exist(err);
      done()
    })
  });

  it('does not fail for empty file', function (done) {
    var files = [
      fixture('fixtures/empty.js')
    ];

    sort(files, function (resultFiles) {
      resultFiles.should.eql(['fixtures/empty.js'])
      done();
    })
  });
});
