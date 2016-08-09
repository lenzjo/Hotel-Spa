/* *************************************************************** *
 * Project:     Gulp4HotelSpa
 * Project URI: http://tlcstuff.uk/Gul4HotelSpa
 * Author:      Clive Thomas
 * Author URI:  http://tlcstuff.uk
 * Description: Heavily modified gulpfile to use Gulp 4. In dev mode
 *              it watches sass, scripts, images and html and
 *              refreshes at any change. It also has a production
 *              mode in which all files are minifyed/compressed.
 * Version:     1.1
 * Date:        6th Aug 2016
 * Updated:     8th Aug 2016 - Added a distribution mode
 *              9th Aug 2016 - Completed. For now....
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
        css:        './css/*.css',
        js:         './assets/scripts/**/*.js',
        images:     './assets/images/**/*.{png,jpeg,jpg,svg,gif}',
        video:      './assets/videos/*',
        fonts:      './fonts/*',
        foundation: [
                        'bower_components/foundation-sites/scss',
                        'bower_components/motion-ui/src'
                    ],
        vendor:     [
                        'bower_components/jquery/dist/jquery.js',
                        'bower_components/what-input/what-input.js',
                        'bower_components/foundation-sites/dist/foundation.js'
                    ]
    },

    dest: {
        css:        './css/',
        js:         './js/',
        images:     './images/',
        fonts:      './fonts',
        video:      './videos/',
        vendor:     './js/'
    },

    watch: {
        html:       './*.html',
        sass:       './assets/scss/**/*.scss',
        js:         './assets/scripts/**/*.js',
        images:     './assets/images/**/*.{png,jpeg,jpg,svg,gif}'
    },

    dist: {
        dir:        './dist/**/*',
        html:       './dist/',
        css:        './dist/css/',
        js:         './dist/js/',
        images:     './dist/images/',
        fonts:      './dist/fonts/',
        video:      './dist/videos/'
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

gulp.task('dev:clean', destClean );

gulp.task('dev:sass', devSass );
gulp.task('dev:js', devJS );
gulp.task('dev:vendorJS', devVendorJS );
gulp.task('dev:images', devImages );
gulp.task('dev:video', devVideos );
gulp.task('dev:watch',  devWatch );

gulp.task('dev:build',
    gulp.series(
        'dev:clean',
        gulp.parallel( 'dev:sass', 'dev:video', 'dev:js', 'dev:vendorJS', 'dev:images' ),
        gulp.parallel( 'dev:watch', 'browserSync' )
    )
);

gulp.task('default', gulp.series('dev'));


// ---------------------------------------------------------------
// PRODUCTION TASKS

gulp.task('prod:clean', destClean );

gulp.task('prod:sass', prodSass );
gulp.task('prod:js', prodJS );
gulp.task('prod:vendorJS', prodVendorJS );
gulp.task('prod:images', prodImages );

// Create the minified/compressed/concatenated files
gulp.task('prod:iniz',
    gulp.series(
        'prod:clean',
        gulp.parallel(
            'prod:sass', 'prod:js', 'prod:vendorJS', 'prod:images', 'dev:video'
        )
    )
);

// Create the minified/compressed/concatenated files
// and watch the results
gulp.task('prod:build',
    gulp.series(
        'prod:iniz',
        gulp.parallel( 'dev:watch', 'browserSync' )
    )
);

// ---------------------------------------------------------------
// DISTRIBUTION TASKS

gulp.task('dist:clean', distClean );

gulp.task('dist:html', distHTML );
gulp.task('dist:css', distCSS );
gulp.task('dist:js', distJS );
gulp.task('dist:fonts', distFonts );
gulp.task('dist:images', distImages );
gulp.task('dist:video', distVideos );


// Create the minified/compressed/concatedenated files then copy to dist dir
gulp.task('dist:iniz',
    gulp.series(
        'prod:iniz',
        'dist:clean',
        gulp.parallel(
            'dist:html', 'dist:css', 'dist:js',
            'dist:fonts', 'dist:images', 'dist:video'
        ),
        'prod:clean'
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
            path.dest.images + '**/*',
            path.dest.fonts + '**/*',
            path.dest.video + '**/*'
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

// VENDOR JS - concat
function devVendorJS() {
    return gulp
        .src(path.src.vendor)
        .pipe(plugins.order(
            path.src.vendor,
            { base: './' }
        ))
        .pipe(plugins.concat('vendorjs.min.js'))
        .pipe(gulp.dest(path.dest.vendor));
}

// Images - copy images to dest dir
function devImages() {
    return gulp
        .src(path.src.images, { since: gulp.lastRun(devImages) }) // Copy only new imgs
        .pipe(gulp.dest(path.dest.images));
}

// Videos - copy
function devVideos() {
    return gulp
        .src(path.src.video)
        .pipe(gulp.dest(path.dest.video));
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

// VENDOR JS - concat
function prodVendorJS() {
    return gulp
        .src(path.src.vendor)
        .pipe(plugins.order(
            path.src.vendor,
            { base: './' }
        ))
        .pipe(plugins.concat('vendorjs.min.js'))
        .pipe(plugins.uglify())
        .pipe(gulp.dest(path.dest.vendor));
}

// Images - compress and copy images to dest dir
function prodImages() {
    return gulp
        .src(path.src.images)
        .pipe(plugins.imagemin({ optimizationLevel: 5 }))
        .pipe(gulp.dest(path.dest.images));
}

// ---------------------------------------------------------------
// DISTRIBUTION FUNCTIONS

// Delete dist dir contents
function distClean() {
    return del(
        [ path.dist.dir ],
        {force: true}   // Just in case dist dir is outside this dir
    );
}

// HTML - copy
function distHTML() {
    return gulp
        .src(path.src.html)
        .pipe(gulp.dest(path.dist.html));
}

// CSS - copy
function distCSS() {
    return gulp
        .src(path.dest.css + '*.css')
        .pipe(gulp.dest(path.dist.css));
}

// JS - copy
function distJS() {
    return gulp
        .src(path.dest.js + '*.js')
        .pipe(gulp.dest(path.dist.js));
}

// CSS - copy
function distImages() {
    return gulp
        .src(path.dest.images + '**/*.{png,jpeg,jpg,svg,gif}')
        .pipe(gulp.dest(path.dist.images));
}

// Videos - copy
function distVideos() {
    return gulp
        .src(path.src.video)
        .pipe(gulp.dest(path.dist.video));
}

// Videos - copy
function distFonts() {
    return gulp
        .src(path.src.fonts)
        .pipe(gulp.dest(path.dist.fonts));
}












