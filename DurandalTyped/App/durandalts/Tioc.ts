///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>

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
