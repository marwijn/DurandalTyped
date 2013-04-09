var Shell = (function () {
    function Shell(router, app) {
        this.app = app;
        this.router = router;
    }
    Shell.prototype.search = function () {
        this.app.showMessage('Search not yet implemented...');
    };
    Shell.prototype.activate = function () {
        return this.router.activate('Welcome');
    };
    return Shell;
})();
Shell.prototype['__classname__'] = 'Shell';
Shell.prototype['__constructorArguments__'] = [
    "Router", 
    "App"
];
//@ sourceMappingURL=shell.js.map
