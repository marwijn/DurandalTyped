class Tioc
{
    private map: { [key: string]: ()=>any; } = {};

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
        return this.map[serviceType]();
    }
}
