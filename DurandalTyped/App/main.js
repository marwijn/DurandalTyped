requirejs.config({
    paths: {
        'text': 'durandal/amd/text'
    }
});

define(['durandal/app', 'durandal/viewLocator', 'durandal/system', 'durandal/plugins/router', 'durandal/http', 'durandal/modalDialog'],
    function(app, viewLocator, system, router, http, modalDialog) {

        //>>excludeStart("build", true);
        system.debug(true);
        //>>excludeEnd("build");

        var tioc = new Tioc();

        DurandalTs.setup(system, app, modalDialog, tioc);

        tioc.RegisterInstance("App", app);
        tioc.RegisterInstance("Router", router);
        tioc.RegisterInstance("Http", http);
        tioc.Register(Shell);
        tioc.Register(Welcome);
        tioc.Register(Flickr);
       
        app.title = 'Durandal Starter Kit';
        app.start().then(function () {


            //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
            //Look for partial views in a 'views' folder in the root.
            viewLocator.useConvention();

            //configure routing
            router.useConvention();
            router.mapNav('Welcome', 'Welcome');
            router.mapNav('Flickr', 'Flickr');

            app.adaptToDevice();

            //viewmodels/shell
            //Show the app by setting the root view model for our application with a transition.
            app.setRoot('Shell', 'entrance');
        });
    });