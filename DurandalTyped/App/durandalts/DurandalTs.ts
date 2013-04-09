///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>

class DurandalTs
{
    static setup(system, app, modalDialog, tioc) : void
    {
        bindPolyFill();
        setupAcquire(system, tioc);
        setupModalDialog(app, modalDialog);
    }

    private static setupModalDialog(app, modalDialog)
    {
        app.showMessage = function (message, title, options) {
            return modalDialog.show('durandal/messageBox', {
                message: message,
                title: title || this.title,
                options: options
            });
        };
    }

    private static setupAcquire(system, tioc)
    {
        system.acquire = function () {
            var modules = Array.prototype.slice.call(arguments, 0);
            return system.defer(function (dfd) {
                var object = tioc.Resolve(modules[0]);
                if (object !== null) {
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
    }

    private static bindPolyFill(): void
    {
    // Polyfill for Function.bind(). Slightly modified version of
    // https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
    if(typeof Function.prototype.bind !== "function") {
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
}