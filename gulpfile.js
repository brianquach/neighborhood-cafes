var gulp = require('gulp');
var cleanCSS = require('gulp-clean-css');
var minifyJS = require('gulp-minify');

var MINIFY_JS = 'minify_js';
gulp.task(MINIFY_JS, function () {
  gulp.src('src/js/*.js')
    .pipe(minifyJS())
    .pipe(gulp.dest('dist/static/js'))
});

var MINIFY_CSS = 'minify_css';
gulp.task(MINIFY_CSS, function () {
  gulp.src('src/css/*.css')
    .pipe(
      cleanCSS({compatibility: 'ie8'})
    )
    .pipe(gulp.dest('dist/static/css'));
});

gulp.task('optimize', [MINIFY_JS, MINIFY_CSS]);
