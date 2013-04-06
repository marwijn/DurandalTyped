class Tioc
{
    private map: { [key: string]: ()=>any; } = {};

    public RegisterInstance(serviceType: string, instance: any) : void
    {
        this.map[serviceType] = ()=>instance;
    }

    public Register(service: any): void
    {
        this.map[service.prototype['__classname__']] = () => new service();
    }

    Resolve(serviceType: string) : any
    {
        if (this.map[serviceType] == null) return null;
        return this.map[serviceType]();
    }
}
