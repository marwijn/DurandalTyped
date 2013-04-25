///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>
var DurandalTs = (function () {
    function DurandalTs() { }
    DurandalTs.setup = function setup(system, app, modalDialog, tioc, viewLocator) {
        DurandalTs.bindPolyFill();
        DurandalTs.setupAcquire(system, tioc);
        DurandalTs.setupModalDialog(app, modalDialog);
        viewLocator.determineFallbackViewId = function (obj) {
            var funcNameRegex = /function (.{1,})\(/;
            var results = (funcNameRegex).exec((obj).constructor.toString());
            var typeName = (results && results.length > 1) ? results[1] : "";
            return 'views/' + typeName.toLowerCase();
        };
    };
    DurandalTs.setupModalDialog = function setupModalDialog(app, modalDialog) {
        app.showMessage = function (message, title, options) {
            return modalDialog.show('durandal/messageBox', {
                message: message,
                title: title || this.title,
                options: options
            });
        };
    };
    DurandalTs.setupAcquire = function setupAcquire(system, tioc) {
        system.acquire = function () {
            var modules = Array.prototype.slice.call(arguments, 0);
            return system.defer(function (dfd) {
                var object = tioc.Resolve(modules[0]);
                if(object !== null) {
                    dfd.resolve(object);
                } else {
                    require(modules, function () {
                        var args = arguments;
                        setTimeout(function () {
                            dfd.resolve.apply(dfd, args);
                        }, 1);
                    });
                }
            }).promise();
        };
    };
    DurandalTs.bindPolyFill = function bindPolyFill() {
        // Polyfill for Function.bind(). Slightly modified version of
        // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
        if(typeof Function.prototype.bind !== "function") {
            Function.prototype.bind = function (oThis) {
                if(typeof this !== "function") {
                    // closest thing possible to the ECMAScript 5 internal IsCallable function
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
    };
    return DurandalTs;
})();
//@ sourceMappingURL=durandalts.js.map
