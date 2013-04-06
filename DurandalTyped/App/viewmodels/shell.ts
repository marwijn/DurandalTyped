///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>
///<reference path='../../Scripts/typings/durandal/durandal.d.ts'/>


class Shell {
    app: any;
    router: any;

    constructor(router: any, app: App) {
        this.app = app;
        this.router = router;
    }

    public search(): void {
        this.app.showMessage('Search not yet implemented...');
    }

    public activate(): any {
        return this.router.activate('welcome');
    }
}


//define(['durandal/plugins/router', 'durandal/app'], function (router, app: App) {
//    return new Shell(router, app);
//});