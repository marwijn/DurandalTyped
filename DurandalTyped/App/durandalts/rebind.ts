///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>

// Polyfill for Function.bind(). Slightly modified version of
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
if (typeof Function.prototype.bind !== "function") {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== "function") {
            // closest thing possible to the ECMAScript 5 internal IsCallable function
            throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
        }

        var aArgs = <any[]> Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () { },
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis ? this : oThis, aArgs.concat());
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}

define([], function () {
    return function Rebind(obj: any) {
        var prototype = <Object>obj.constructor.prototype;
        for (var name in prototype) {
            if (!obj.hasOwnProperty(name)
                    && typeof prototype[name] === "function") {
                var method = <Function>prototype[name];
                obj[name] = method.bind(obj);
            }
        }
    }
});



