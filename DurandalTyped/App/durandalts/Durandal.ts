///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>
///<reference path='../../Scripts/typings/durandal/durandal.d.ts'/>
///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>


class App_Interface
{
    static name = "App";
}

class Router_Interface
{
    static name = "Router";
}

class Tioc
{
    private map: { [key: string]: ()=>any; } = {};

    public RegisterInstance(service: any, instance: any) : void
    {
        this.map[service.name] = ()=>instance;
    }

    public Register(service: any): void
    {
        this.map[service.prototype['__classname__']] = () => new service();
    }

    Resolve(object: any) : any
    {
        return this.map[object.prototype['__classname__']]();
    }
}
