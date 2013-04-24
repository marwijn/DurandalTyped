///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>
var Tioc = (function () {
    function Tioc() {
        this.map = {
        };
    }
    Tioc.prototype.Rebind = function (obj) {
        var prototype = obj.constructor.prototype;
        for(var name in prototype) {
            if(!obj.hasOwnProperty(name) && typeof prototype[name] === "function") {
                var method = prototype[name];
                obj[name] = method.bind(obj);
            }
        }
    };
    Tioc.prototype.RegisterInstance = function (serviceType, instance) {
        this.map[serviceType] = function () {
            return instance;
        };
    };
    Tioc.prototype.Register = function (service) {
        var _this = this;
        this.map[service.prototype['__classname__']] = function () {
            var arguments = service.prototype['__constructorArguments__'];
            var objects = new Array();
            for(var i = 0; i < arguments.length; i++) {
                objects[i] = _this.Resolve(arguments[i]);
            }
            ;
            return new service(objects[0], objects[1], objects[2], objects[3], objects[4], objects[5], objects[6], objects[7], objects[8], objects[9]);
        };
    };
    Tioc.prototype.Resolve = function (serviceType) {
        if(this.map[serviceType] == null) {
            return null;
        }
        var service = this.map[serviceType]();
        this.Rebind(service);
        return service;
    };
    return Tioc;
})();
//@ sourceMappingURL=tioc.js.map
