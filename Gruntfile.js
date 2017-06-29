// tasks and configurations needed for testing and packaging the project
module.exports = function (grunt) {
    grunt.initConfig({
        // tasks
        jshint: {
            all: ['src/**/*.js', 'test/**/*.js'],
            options: {
                globals: {
                    _: false, // Lo-Dash
                    $: false, // jQuery
                    jasmine: false,
                    describe: false,
                    fdescribe: false,
                    it: false,
                    xit: false,
                    fit: false,
                    expect: false,
                    beforeEach: false,
                    afterEach: false,
                    sinon: false               
                },
                // enabling the browser and devel JSHint environments
                browser: true,
                devel: true
            }
        },

        testem: {
            unit: {
                options: {
                    framework: 'jasmine2',
                    //PhantomJS is a headless Webkit browser that lets us run tests without necessarily having to manage external browsers
                    launch_in_dev: ['chrome'],
                    before_tests: 'grunt jshint',
                    serve_files: [
                        'node_modules/jquery/dist/jquery.js',
                        'node_modules/lodash/lodash.js',
                        'node_modules/sinon/pkg/sinon.js',
                        'src/**/*.js',
                        'test/**/*.js'
                    ],
                    watch_files: [
                        'src/**/*.js',
                        'test/**/*.js'
                    ]
                }
            }
        }
    });

    // load tasks into my build
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-testem');
    grunt.registerTask('default', ['testem:run:unit']);
};