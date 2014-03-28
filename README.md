# gulp-angular-filesort [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][depstat-image]][depstat-url]

> Automatically sort AngularJS app files depending on module definitions and usage

## Primary objective

Used in conjunction with [`gulp-inject`](https://www.npmjs.org/package/gulp-inject) to inject your AngularJS application files (scripts) in a correct order, to get rid of all `Uncaught Error: [$injector:modulerr]`.

## Installation

Install `gulp-angular-filesort` as a development dependency:

```shell
npm install --save-dev gulp-angular-filesort
```

## Usage

### In your `gulpfile.js`:

```javascript
var angularFilesort = require('gulp-angular-filesort'),
    inject = require('gulp-inject');

gulp.src('./src/app/index.html')
  .pipe(inject(
    gulp.src(['./src/app/**/*.js']).pipe(angularFilesort())
  ))
  .pipe(gulp.dest('./build'));
```

## License

[MIT License](http://en.wikipedia.org/wiki/MIT_License)

[npm-url]: https://npmjs.org/package/gulp-angular-filesort
[npm-image]: https://badge.fury.io/js/gulp-angular-filesort.png

[travis-url]: http://travis-ci.org/klei/gulp-angular-filesort
[travis-image]: https://secure.travis-ci.org/klei/gulp-angular-filesort.png?branch=master

[depstat-url]: https://david-dm.org/klei/gulp-angular-filesort
[depstat-image]: https://david-dm.org/klei/gulp-angular-filesort.png
