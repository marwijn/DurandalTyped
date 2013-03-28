var Flickr = (function () {
    function Flickr(app, http) {
        this.displayName = 'Flickr';
        this.images = ko.observableArray([]);
        this.app = app;
        this.http = http;
    }
    Flickr.prototype.activate = function () {
        var _this = this;
        if(this.images().length > 0) {
            return;
        }
        return this.http.jsonp('http://api.flickr.com/services/feeds/photos_public.gne', {
            tags: 'mount ranier',
            tagmode: 'any',
            format: 'json'
        }, 'jsoncallback').then(function (response) {
            _this.images(response.items);
        });
    };
    Flickr.prototype.select = function (item) {
        item.viewUrl = 'views/detail';
        this.app.showModal(item);
    };
    Flickr.prototype.canDeactivate = function () {
        return this.app.showMessage('Are you sure you want to leave this page?', 'Navigate', [
            'Yes', 
            'No'
        ]);
    };
    return Flickr;
})();
define([
    'durandal/http', 
    'durandal/app', 
    'durandalts/rebind'
], function (http, app, rebind) {
    var flickr = new Flickr(app, http);
    rebind(flickr);
    return flickr;
});
//@ sourceMappingURL=flickr.js.map
