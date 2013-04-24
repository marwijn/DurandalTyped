///<reference path='viewmodels/shell.ts'/>
///<reference path='viewmodels/welcome.ts'/>
///<reference path='viewmodels/flickr.ts'/>
///<reference path='durandalTs/tioc.ts'/>
///<reference path='durandalTs/durandalts.ts'/>

declare var Durandal: any;

Durandal.system.debug(true);


Durandal.app.title = 'Durandal Samples';
Durandal.app.start().then(function () {
//    //Replace 'viewmodels' in the moduleId with 'views' to locate the view.
//    //Look for partial views in a 'views' folder in the root.
    Durandal.viewLocator.useConvention();
    Durandal.app.adaptToDevice();
    //    var welcome = new Welcome();
    var tioc = new Tioc();

    DurandalTs.setup(Durandal.system, Durandal.app, Durandal.modalDialog, tioc);

    tioc.RegisterInstance("App", Durandal.app);
    tioc.RegisterInstance("Router", Durandal.router);
    tioc.RegisterInstance("Http", Durandal.http);
    tioc.Register(Shell);
    tioc.Register(Welcome);
    tioc.Register(Flickr);


    //Durandal.app.showMessage("test");
    //Durandal.app.setRoot('Welcome');
    Durandal.app.setRoot(tioc.Resolve('Welcome'));
});