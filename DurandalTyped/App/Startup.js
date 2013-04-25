Durandal.system.debug(true);
Durandal.app.title = 'Durandal Samples';
Durandal.app.start().then(function () {
    Durandal.viewLocator.useConvention();
    Durandal.app.adaptToDevice();
    var tioc = new Tioc();
    DurandalTs.setup(Durandal.system, Durandal.app, Durandal.modalDialog, tioc, Durandal.viewLocator);
    tioc.RegisterInstance("App", Durandal.app);
    tioc.RegisterInstance("Router", Durandal.router);
    tioc.RegisterInstance("Http", Durandal.http);
    tioc.Register(Shell);
    tioc.Register(Welcome);
    tioc.Register(Flickr);
    Durandal.app.setRoot(tioc.Resolve('Welcome'));
});
//@ sourceMappingURL=Startup.js.map
