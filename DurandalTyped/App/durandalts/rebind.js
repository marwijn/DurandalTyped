if(typeof Function.prototype.bind !== "function") {
    Function.prototype.bind = function (oThis) {
        if(typeof this !== "function") {
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }
        var aArgs = Array.prototype.slice.call(arguments, 1), fToBind = this, fNOP = function () {
        }, fBound = function () {
            return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat());
        };
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
        return fBound;
    };
}
define([], function () {
    return function Rebind(obj) {
        var prototype = obj.constructor.prototype;
        for(var name in prototype) {
            if(!obj.hasOwnProperty(name) && typeof prototype[name] === "function") {
                var method = prototype[name];
                obj[name] = method.bind(obj);
            }
        }
    };
});
//@ sourceMappingURL=rebind.js.map
