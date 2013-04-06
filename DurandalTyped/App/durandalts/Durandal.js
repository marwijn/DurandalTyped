var App_Interface = (function () {
    function App_Interface() { }
    App_Interface.name = "App";
    return App_Interface;
})();
var Router_Interface = (function () {
    function Router_Interface() { }
    Router_Interface.name = "Router";
    return Router_Interface;
})();
var Tioc = (function () {
    function Tioc() {
        this.map = {
        };
    }
    Tioc.prototype.RegisterInstance = function (service, instance) {
        this.map[service.name] = function () {
            return instance;
        };
    };
    Tioc.prototype.Register = function (service) {
        this.map[service.prototype['__classname__']] = function () {
            return new service();
        };
    };
    Tioc.prototype.Resolve = function (object) {
        return this.map[object.prototype['__classname__']]();
    };
    return Tioc;
})();
//@ sourceMappingURL=Durandal.js.map
