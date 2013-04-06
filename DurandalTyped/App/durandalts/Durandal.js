var Tioc = (function () {
    function Tioc() {
        this.map = {
        };
    }
    Tioc.prototype.RegisterInstance = function (serviceType, instance) {
        this.map[serviceType] = function () {
            return instance;
        };
    };
    Tioc.prototype.Register = function (service) {
        this.map[service.prototype['__classname__']] = function () {
            return new service();
        };
    };
    Tioc.prototype.Resolve = function (serviceType) {
        if(this.map[serviceType] == null) {
            return null;
        }
        return this.map[serviceType]();
    };
    return Tioc;
})();
//@ sourceMappingURL=Durandal.js.map
