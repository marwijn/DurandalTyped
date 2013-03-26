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
define([
    'durandal/plugins/router', 
    'durandal/app', 
    'durandal/system'
], function (router, app, system) {
    return new Shell(router, app);
});
//@ sourceMappingURL=shell.js.map
