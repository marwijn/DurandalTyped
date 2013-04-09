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

class Tioc
{
    private map: { [key: string]: ()=>any; } = {};

    private Rebind(obj: any)
    {
        var prototype = <Object>obj.constructor.prototype;
        for (var name in prototype)
        {
            if (!obj.hasOwnProperty(name)
                    && typeof prototype[name] === "function")
            {
                var method = <Function>prototype[name];
                obj[name] = method.bind(obj);
            }
        }
    }

    public RegisterInstance(serviceType: string, instance: any) : void
    {
        this.map[serviceType] = ()=>instance;
    }

    public Register(service: any): void
    {
        this.map[service.prototype['__classname__']] = () =>
        {
            var arguments = service.prototype['__constructorArguments__'];
            var objects = new Array();
            for (var i=0; i < arguments.length; i++)
            {
                objects[i] = this.Resolve(arguments[i]);
            };
            return new service(objects[0], objects[1], objects[2], objects[3], objects[4], objects[5], objects[6], objects[7], objects[8], objects[9]);
        } 
    }

    Resolve(serviceType: string) : any
    {
        if (this.map[serviceType] == null) return null;
        var service = this.map[serviceType]();
        this.Rebind(service);
        return service;
    }
}
