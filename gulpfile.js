var gulp = require('gulp'),
  uglify = require('gulp-uglify'),
  concat = require('gulp-concat'),
  babel = require('gulp-babel');

gulp.task('jsmix', function () {
  return gulp.src(['js/oo/*.js', '!js/jquery.js', '!js/opencv.js'])
    .pipe(babel())
    //.pipe(uglify())
    .pipe(gulp.dest('dist/js'))
});

gulp.task('concat', ['jsmix'], function () {
  gulp.src('dist/js/**/*.js')
    .pipe(concat('waspot.js'))
    .pipe(gulp.dest('dist/'))
})

gulp.task('default', ['concat'])