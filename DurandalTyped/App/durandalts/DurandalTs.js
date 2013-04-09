var DurandalTs = (function () {
    function DurandalTs() { }
    DurandalTs.setup = function setup(system, app, modalDialog, tioc) {
        DurandalTs.bindPolyFill();
        DurandalTs.setupAcquire(system, tioc);
        DurandalTs.setupModalDialog(app, modalDialog);
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
        if(typeof Function.prototype.bind !== "function") {
            Function.prototype.bind = function (oThis) {
                if(typeof this !== "function") {
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
//@ sourceMappingURL=DurandalTs.js.map
