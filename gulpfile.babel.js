/* *************************************************************** *
 * Project:     Gulp4HotelSpa
 * Project URI: http://tlcstuff.uk/Gul4HotelSpa
 * Author:      Clive Thomas
 * Author URI:  http://tlcstuff.uk
 * Description: Heavily modified gulpfile to use Gulp 4. In dev mode
 *              it watches sass, scripts, images and html and
 *              refreshes at any change. It also has a production
 *              mode in which all files are minifyed/compressed.
 * Version:     1.0
 * Date:        6th Aug 2016
 * *************************************************************** */

'use strict';


// =============================================================== *
// REQUIRES
// =============================================================== *

let gulp           = require("gulp"),
    del            = require('del'),
    browserSync    = require("browser-sync").create(),
    reload         = browserSync.reload,

    plugins        = require("gulp-load-plugins")();


// =============================================================== *
// CONSTANTS like PATHS etc.
// =============================================================== *

const PROJECT_URL = 'hotelspa.dev';

const path = {
    src: {
        html:       './*.html',
        sass:       [
                        './assets/css/**/*.css',
                        './assets/scss/*.scss'
                    ],
        js:         './assets/scripts/**/*.js',
        images:     './assets/images/**/*.{png,jpeg,jpg,svg,gif}',
        foundation: [
                        'bower_components/foundation-sites/scss',
                        'bower_components/motion-ui/src'
                    ],
    },
    watch: {
        html:       './*.html',
        sass:       './scss/**/*.scss',
        js:         './scripts/**/*.js',
        images:     './assets/images/**/*.{png,jpeg,jpg,svg,gif}'
    },
    dest: {
        css:        './css/',
        js:         './js/',
        images:     './images/'
    }
};

const BROWSER_LIST = { browsers: ['last 2 versions', 'ie >= 9'] };


// =============================================================== *
// BROWSER-SYNC setup for xampp/mamp etc.
// =============================================================== *

gulp.task('browserSync', () => {
   browserSync.init({
       proxy: PROJECT_URL,
       open: true,
       injectChanges: true,
       notify: false,
       browser: ['google chrome'],
//       reloadDelay: 750,    // See sass comment below.
       files: [
           path.watch.html,
//           path.watch.sass, // Might need to use 'reloadDelay' if
                            // you watch the scss!!
           path.dest.css,  // Watching the css instead of the src!
           path.watch.js,
           path.watch.images
       ]
   });
});


// =============================================================== *
// TASKS
// =============================================================== *

// ---------------------------------------------------------------
// DEVELOPMENT TASKS

gulp.task('dest:clean', destClean );

gulp.task('dev:sass', devSass );
gulp.task('dev:js', devJS );
gulp.task('dev:images', devImages );

gulp.task('dev:watch',  devWatch );

gulp.task('dev',
    gulp.series(
        'dest:clean',
        gulp.parallel( 'dev:sass', 'dev:js', 'dev:images' ),
        gulp.parallel( 'dev:watch', 'browserSync' )
    )
);

gulp.task('default', gulp.series('dev'));


// ---------------------------------------------------------------
// PRODUCTION TASKS

gulp.task('prod:sass', prodSass );
gulp.task('prod:js', prodJS );
gulp.task('prod:images', prodImages );

gulp.task('prod',
    gulp.series(
        'dest:clean',
        gulp.parallel( 'prod:sass', 'prod:js', 'prod:images' )
    )
);


// =============================================================== *
// FUNCTIONS
// =============================================================== *

// Delete contents of all dest dirs
function destClean() {
    return del(
        [
            path.dest.css + '**/*',
            path.dest.js + '**/*',
            path.dest.images + '**/*'
        ],
        {force: true}   // Just in case dest dir is outside this dir
    );
}


// ---------------------------------------------------------------
// DEVELOPMENT FUNCTIONS


// SASS - add vendor prefixes and source-maps
function devSass() {
    return gulp
        .src(path.src.sass)
        .pipe(plugins.sourcemaps.init())

        .pipe(plugins.sass({ includePaths: path.src.foundation })
        .on('error', plugins.sass.logError))
        .pipe(plugins.autoprefixer( BROWSER_LIST ))
        .pipe(plugins.concat('app.css'))
        .pipe(plugins.rename({ suffix: '.min' }))
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(path.dest.css));
}

// JS - concat and add source-maps
function devJS() {
    return gulp
        .src(path.src.js)
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('app.js'))
        .pipe(plugins.babel())      // Just in case there's ES6 in the scripts!
        .pipe(plugins.rename({ suffix: '.min' }))
        .pipe(plugins.sourcemaps.write("."))
        .pipe(gulp.dest(path.dest.js));
}

// Images - copy images to dest dir
function devImages() {
    return gulp
        .src(path.src.images, { since: gulp.lastRun(devImages) }) // Copy only new imgs
        .pipe(gulp.dest(path.dest.images));
}

// WATCH for src file changes
function devWatch() {
    gulp.watch(path.watch.html).on('change', reload);
    gulp.watch(path.watch.sass, gulp.series('dev:sass'));
    gulp.watch(path.watch.js, gulp.series('dev:js'));
    gulp.watch(path.watch.images, gulp.series('dev:images'));
}


// ---------------------------------------------------------------
// PRODUCTION FUNCTIONS

// SASS - add vendor prefixes and minify css
function prodSass() {
    return gulp
        .src(path.src.sass)
        .pipe(plugins.sass({ includePaths: path.src.foundation }))
        .pipe(plugins.autoprefixer( BROWSER_LIST ))
        .pipe(plugins.cleanCss())
    .pipe(plugins.concat('app.css'))
        .pipe(plugins.rename({ suffix: '.min' }))
        .pipe(gulp.dest(path.dest.css));
}

// JS - concat and compress all JS
function prodJS() {
    return gulp
        .src(path.src.js)
        .pipe(plugins.concat('app.js'))
        .pipe(plugins.babel())          // Just in case there's ES6 in the scripts!
        .pipe(plugins.uglify())
        .pipe(plugins.rename({ suffix: '.min' }))
        .pipe(gulp.dest(path.dest.js));
}

// Images - compress and copy images to dest dir
function prodImages() {
    return gulp
        .src(path.src.images)
        .pipe(plugins.imagemin({ optimizationLevel: 5 }))
        .pipe(gulp.dest(path.dest.images));
}
