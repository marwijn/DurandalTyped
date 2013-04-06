var Shell = (function () {
    function Shell(router, app) {
        this.app = app;
        this.router = router;
    }
    Shell.prototype.search = function () {
        this.app.showMessage('Search not yet implemented...');
    };
    Shell.prototype.activate = function () {
        return this.router.activate('welcome');
    };
    return Shell;
})();
//@ sourceMappingURL=shell.js.map
