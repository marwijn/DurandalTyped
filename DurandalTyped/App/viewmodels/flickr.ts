///<reference path='../../Scripts/typings/durandal/durandal.d.ts'/>

class Flickr {
    app: App;
    http: Http;

    displayName = 'Flickr';
    images = ko.observableArray([]);

    constructor(app: App, http: Http) {
        this.app = app;
        this.http = http;
    }

    public activate(): any {
        //the router's activator calls this function and waits for it to complete before proceding
        if (this.images().length > 0) {
            return;
        }

        return this.http.jsonp('http://api.flickr.com/services/feeds/photos_public.gne', { tags: 'mount ranier', tagmode: 'any', format: 'json' }, 'jsoncallback').then((response) =>
        {
            this.images(response.items);
        });
    }
    public select(item: any) {
        //the app model allows easy display of modal dialogs by passing a view model
        //views are usually located by convention, but you an specify it as well with viewUrl
        item.viewUrl = 'views/detail';
        this.app.showModal(item);
    }
    public canDeactivate(): any {
        //the router's activator calls this function to see if it can leave the screen
        return this.app.showMessage('Are you sure you want to leave this page?', 'Navigate', ['Yes', 'No']);
    }
}

/// this code should be generated
Flickr.prototype['__classname__'] = 'Flickr';
Flickr.prototype['__constructorArguments__'] = ['App', 'Http'];
