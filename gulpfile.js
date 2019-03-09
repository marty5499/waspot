var gulp = require('gulp'),
  concat = require('gulp-concat'),
  babel = require('gulp-babel');

const uglifyes = require('uglify-es');
const composer = require('gulp-uglify/composer');
const uglify = composer(uglifyes, console);

function jsmix() {
  return gulp.src(
      ['js/*.js', 'js/oo/*.js',
        '!js/jquery.js', '!js/opencv.js', '!js/tfjs@0.14.1.js'
      ])
    .pipe(babel())
    .pipe(concat('waspot.js'))
    .pipe(gulp.dest('dist/es6/'))
}

function jsmin() {
  return gulp.src(['dist/es6/waspot.js'])
    .pipe(uglify())
    .pipe(gulp.dest('dist/min/'))
}

gulp.task(jsmin);
gulp.task(jsmix);

gulp.task('default', gulp.series(jsmix, jsmin));