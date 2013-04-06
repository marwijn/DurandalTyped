///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>
///<reference path='../../Scripts/typings/durandal/durandal.d.ts'/>


class Shell {
    app: any;
    router: any;

    constructor(router: Router, app: App) {
        this.app = app;
        this.router = router;
    }

    public search(): void {
        this.app.showMessage('Search not yet implemented...');
    }

    public activate(): any {
        return this.router.activate('Flickr');
    }
}

/// this code should be generated 
Shell.prototype['__classname__'] = 'Shell';
Shell.prototype['__constructorArguments__'] = ["Router", "App"];
