requirejs.config({
    paths: {
        'text': 'durandal/amd/text'
    }
});

define(['durandal/app', 'durandal/viewLocator', 'durandal/system', 'durandal/plugins/router'],
    function(app, viewLocator, system, router) {

        //>>excludeStart("build", true);
        system.debug(true);
        //>>excludeEnd("build");

        var tioc = new Tioc();
        tioc.RegisterInstance(App_Interface, app);
        tioc.RegisterInstance(Router_Interface, router);
        tioc.Register(Welcome);
        var welcome = tioc.Resolve(Welcome);
        
        system.acquire=function() {
            var modules = Array.prototype.slice.call(arguments, 0);
            return system.defer(function (dfd) {
                if (modules == "test") {
                    dfd.resolve(welcome);
                }
                

                require(modules, function () {
                    var args = arguments;
                    setTimeout(function () {
                        dfd.resolve.apply(dfd, args);
                    }, 1);
                });
            }).promise();
        };
        app.title = 'Durandal Starter Kit';
        app.start().then(function () {


            //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
            //Look for partial views in a 'views' folder in the root.
            viewLocator.useConvention();

            //configure routing
            router.useConvention();
            router.mapNav('welcome');
            router.mapNav('flickr');

            app.adaptToDevice();

            //viewmodels/shell
            //Show the app by setting the root view model for our application with a transition.
            app.setRoot('test', 'entrance');
        });
    });