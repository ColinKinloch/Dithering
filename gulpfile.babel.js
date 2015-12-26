import _ from 'lodash'

import gulp from 'gulp'
import util from 'gulp-util'
import livereload from 'gulp-livereload'

import webpackConfig from './webpack.config.babel.js'

let webpackDevConfig = _.extend(webpackConfig, {
  bail: false
})

let ignoreGlob = ['!node_modules/**', '!bower_components/**']

let d = {
  dist: 'dist/',
  temp: '.tmp/',
  src: 'src/'
}
let s = {
  host: '0.0.0.0',
  port: 8080
}
let jadeGlob = [`${d.src}**/*.jade`]
let sassGlob = [`${d.src}**/*.scss`]
let ecmaGlob = [`${d.src}**/*.js`]
let glslGlob = [`${d.src}**/*.glsl?([fv])`]

gulp.task('default', ['build'])

gulp.task('serve', ['server', 'build', 'watch'])

gulp.task('watch', () => {
  gulp.watch(ecmaGlob.concat(glslGlob, ignoreGlob), ['scripts'])
  gulp.watch(jadeGlob.concat(ignoreGlob), ['jade'])
  gulp.watch(sassGlob.concat(ignoreGlob), ['sass'])
})

gulp.task('build', ['jade', 'scripts', 'styles'])

gulp.task('server', () => {
  let koa = require('koa')
  let serve = require('koa-static')
  let body = require('koa-bodyparser')
  let server = koa()
  server.use(body())
    .use(serve(d.dist))
    .use(serve(d.src))
    .listen(s.port, s.host, () => {
      util.log('Listening at', util.colors.magenta(`http://${s.host}:${s.port}`))
      livereload.listen()
    })
})

gulp.task('scripts', ['eslint', 'webpack'])
gulp.task('styles', ['sass'])

gulp.task('jade', () => {
  let jade = require('gulp-jade')
  return gulp.src(jadeGlob.concat(ignoreGlob))
    .pipe(jade())
    .pipe(gulp.dest(d.dist))
})

gulp.task('sass', () => {
  let sass = require('gulp-sass')
  return gulp.src(sassGlob.concat(ignoreGlob))
    .pipe(sass())
    .pipe(gulp.dest(d.dist))
})

gulp.task('webpack', () => {
  let webpack = require('webpack-stream')
  return gulp.src(ecmaGlob.concat(glslGlob, ignoreGlob))
    .pipe(webpack(webpackDevConfig))
    .pipe(gulp.dest(d.dist))
})

gulp.task('eslint', () => {
  let eslint = require('gulp-eslint')
  return gulp.src(ecmaGlob.concat(glslGlob, ignoreGlob))
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(gulp.dest(d.dist))
})
