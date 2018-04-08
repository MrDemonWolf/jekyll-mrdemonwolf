var gulp = require('gulp');
var bs = require('browser-sync').create();
// Runs the browser sync server
    gulp.task('default', function() {
    bs.init({
        server: {
            baseDir: "./",
        },
    });
});


    gulp.task('watch', ['default'], function () {
    gulp.watch("./index.html").on('change', bs.reload);
})
