var Durandal = function() {
};
/**
 * almond 0.2.0 Copyright (c) 2011, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        aps = [].slice;

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (waiting.hasOwnProperty(name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!defined.hasOwnProperty(name) && !defining.hasOwnProperty(name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    function onResourceLoad(name, defined, deps) {
        if (requirejs.onResourceLoad && name) {
            requirejs.onResourceLoad({ defined: defined }, { id: name }, deps);
        }
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (defined.hasOwnProperty(depName) ||
                           waiting.hasOwnProperty(depName) ||
                           defining.hasOwnProperty(depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }

        onResourceLoad(name, defined, args);
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () { };

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 15);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        waiting[name] = [name, deps, callback];
    };

    define.amd = {
        jQuery: true
    };
}());

define("durandal/amd/almond-custom", function () { });

define('durandal/system', ['require'], function (require) {
    var isDebugging = false,
        nativeKeys = Object.keys,
        hasOwnProperty = Object.prototype.hasOwnProperty,
        toString = Object.prototype.toString,
        system,
        treatAsIE8 = false;

    //see http://patik.com/blog/complete-cross-browser-console-log/
    // Tell IE9 to use its built-in console
    if (Function.prototype.bind && (typeof console === 'object' || typeof console === 'function') && typeof console.log == 'object') {
        try {
            ['log', 'info', 'warn', 'error', 'assert', 'dir', 'clear', 'profile', 'profileEnd']
                .forEach(function (method) {
                    console[method] = this.call(console[method], console);
                }, Function.prototype.bind);
        } catch (ex) {
            treatAsIE8 = true;
        }
    }

    // callback for dojo's loader 
    // note: if you wish to use Durandal with dojo's AMD loader,
    // currently you must fork the dojo source with the following
    // dojo/dojo.js, line 1187, the last line of the finishExec() function: 
    //  (add) signal("moduleLoaded", [module.result, module.mid]);
    // an enhancement request has been submitted to dojo to make this
    // a permanent change. To view the status of this request, visit:
    // http://bugs.dojotoolkit.org/ticket/16727

    if (require.on) {
        require.on("moduleLoaded", function (module, mid) {
            system.setModuleId(module, mid);
        });
    }

    // callback for require.js loader
    if (typeof requirejs !== 'undefined') {
        requirejs.onResourceLoad = function (context, map, depArray) {
            system.setModuleId(context.defined[map.id], map.id);
        };
    }

    var noop = function () { };

    var log = function () {
        try {
            // Modern browsers
            if (typeof console != 'undefined' && typeof console.log == 'function') {
                // Opera 11
                if (window.opera) {
                    var i = 0;
                    while (i < arguments.length) {
                        console.log('Item ' + (i + 1) + ': ' + arguments[i]);
                        i++;
                    }
                }
                    // All other modern browsers
                else if ((Array.prototype.slice.call(arguments)).length == 1 && typeof Array.prototype.slice.call(arguments)[0] == 'string') {
                    console.log((Array.prototype.slice.call(arguments)).toString());
                } else {
                    console.log(Array.prototype.slice.call(arguments));
                }
            }
                // IE8
            else if ((!Function.prototype.bind || treatAsIE8) && typeof console != 'undefined' && typeof console.log == 'object') {
                Function.prototype.call.call(console.log, console, Array.prototype.slice.call(arguments));
            }

            // IE7 and lower, and other old browsers
        } catch (ignore) { }
    };

    var logError = function (error) {
        throw error;
    };

    system = {
        version: "1.2.0",
        noop: noop,
        getModuleId: function (obj) {
            if (!obj) {
                return null;
            }

            if (typeof obj == 'function') {
                return obj.prototype.__moduleId__;
            }

            if (typeof obj == 'string') {
                return null;
            }

            return obj.__moduleId__;
        },
        setModuleId: function (obj, id) {
            if (!obj) {
                return;
            }

            if (typeof obj == 'function') {
                obj.prototype.__moduleId__ = id;
                return;
            }

            if (typeof obj == 'string') {
                return;
            }

            obj.__moduleId__ = id;
        },
        debug: function (enable) {
            if (arguments.length == 1) {
                isDebugging = enable;
                if (isDebugging) {
                    this.log = log;
                    this.error = logError;
                    this.log('Debug mode enabled.');
                } else {
                    this.log('Debug mode disabled.');
                    this.log = noop;
                    this.error = noop;
                }
            } else {
                return isDebugging;
            }
        },
        isArray: function (obj) {
            return toString.call(obj) === '[object Array]';
        },
        log: noop,
        error: noop,
        defer: function (action) {
            return $.Deferred(action);
        },
        guid: function () {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        },
        acquire: function () {
            var modules = Array.prototype.slice.call(arguments, 0);
            return this.defer(function (dfd) {
                require(modules, function () {
                    var args = arguments;
                    setTimeout(function () {
                        dfd.resolve.apply(dfd, args);
                    }, 1);
                });
            }).promise();
        }
    };

    system.keys = nativeKeys || function (obj) {
        if (obj !== Object(obj)) {
            throw new TypeError('Invalid object');
        }

        var keys = [];

        for (var key in obj) {
            if (hasOwnProperty.call(obj, key)) {
                keys[keys.length] = key;
            }
        }

        return keys;
    };

    return system;
});
define('durandal/viewEngine', ['./system'], function (system) {
    var parseMarkupCore;

    if ($.parseHTML) {
        parseMarkupCore = function (html) {
            return $.parseHTML(html);
        };
    } else {
        parseMarkupCore = function (html) {
            return $(html).get();
        };
    }

    return {
        viewExtension: '.html',
        viewPlugin: 'text',
        isViewUrl: function (url) {
            return url.indexOf(this.viewExtension, url.length - this.viewExtension.length) !== -1;
        },
        convertViewUrlToViewId: function (url) {
            return url.substring(0, url.length - this.viewExtension.length);
        },
        convertViewIdToRequirePath: function (viewId) {
            return this.viewPlugin + '!' + viewId + this.viewExtension;
        },
        parseMarkup: function (markup) {
            var allElements = parseMarkupCore(markup);
            if (allElements.length == 1) {
                return allElements[0];
            }

            var withoutCommentsOrEmptyText = [];

            for (var i = 0; i < allElements.length; i++) {
                var current = allElements[i];
                if (current.nodeType != 8) {
                    if (current.nodeType == 3) {
                        var result = /\S/.test(current.nodeValue);
                        if (!result) {
                            continue;
                        }
                    }

                    withoutCommentsOrEmptyText.push(current);
                }
            }

            if (withoutCommentsOrEmptyText.length > 1) {
                return $(withoutCommentsOrEmptyText).wrapAll('<div class="durandal-wrapper"></div>').parent().get(0);
            }

            return withoutCommentsOrEmptyText[0];
        },
        createView: function (viewId) {
            var that = this;
            var requirePath = this.convertViewIdToRequirePath(viewId);

            return system.defer(function (dfd) {
                system.acquire(requirePath).then(function (markup) {
                    var element = that.parseMarkup(markup);
                    element.setAttribute('data-view', viewId);
                    dfd.resolve(element);
                });
            }).promise();
        }
    };
});
define('durandal/viewLocator', ['./system', './viewEngine'],
    function (system, viewEngine) {

        function findInElements(nodes, url) {
            for (var i = 0; i < nodes.length; i++) {
                var current = nodes[i];
                var existingUrl = current.getAttribute('data-view');
                if (existingUrl == url) {
                    return current;
                }
            }
        }

        function escape(str) {
            return (str + '').replace(/([\\\.\+\*\?\[\^\]\$\(\)\{\}\=\!\<\>\|\:])/g, "\\$1");
        }

        return {
            useConvention: function (modulesPath, viewsPath, areasPath) {
                modulesPath = modulesPath || 'viewmodels';
                viewsPath = viewsPath || 'views';
                areasPath = areasPath || viewsPath;

                var reg = new RegExp(escape(modulesPath), 'gi');

                this.convertModuleIdToViewId = function (moduleId) {
                    return moduleId.replace(reg, viewsPath);
                };

                this.translateViewIdToArea = function (viewId, area) {
                    if (!area || area == 'partial') {
                        return areasPath + '/' + viewId;
                    }

                    return areasPath + '/' + area + '/' + viewId;
                };
            },
            locateViewForObject: function (obj, elementsToSearch) {
                var view;

                if (obj.getView) {
                    view = obj.getView();
                    if (view) {
                        return this.locateView(view, null, elementsToSearch);
                    }
                }

                if (obj.viewUrl) {
                    return this.locateView(obj.viewUrl, null, elementsToSearch);
                }

                var id = system.getModuleId(obj);
                if (id) {
                    return this.locateView(this.convertModuleIdToViewId(id), null, elementsToSearch);
                }

                return this.locateView(this.determineFallbackViewId(obj), null, elementsToSearch);
            },
            convertModuleIdToViewId: function (moduleId) {
                return moduleId;
            },
            determineFallbackViewId: function (obj) {
                var funcNameRegex = /function (.{1,})\(/;
                var results = (funcNameRegex).exec((obj).constructor.toString());
                var typeName = (results && results.length > 1) ? results[1] : "";

                return 'views/' + typeName;
            },
            translateViewIdToArea: function (viewId, area) {
                return viewId;
            },
            locateView: function (viewOrUrlOrId, area, elementsToSearch) {
                if (typeof viewOrUrlOrId === 'string') {
                    var viewId;

                    if (viewEngine.isViewUrl(viewOrUrlOrId)) {
                        viewId = viewEngine.convertViewUrlToViewId(viewOrUrlOrId);
                    } else {
                        viewId = viewOrUrlOrId;
                    }

                    if (area) {
                        viewId = this.translateViewIdToArea(viewId, area);
                    }

                    if (elementsToSearch) {
                        var existing = findInElements(elementsToSearch, viewId);
                        if (existing) {
                            return system.defer(function (dfd) {
                                dfd.resolve(existing);
                            }).promise();
                        }
                    }

                    return viewEngine.createView(viewId);
                }

                return system.defer(function (dfd) {
                    dfd.resolve(viewOrUrlOrId);
                }).promise();
            }
        };
    });
define('durandal/viewModelBinder', ['./system'], function (system) {
    var viewModelBinder;
    var insufficientInfoMessage = 'Insufficient Information to Bind';
    var unexpectedViewMessage = 'Unexpected View Type';

    function doBind(obj, view, action) {
        if (!view || !obj) {
            if (viewModelBinder.throwOnErrors) {
                system.error(new Error(insufficientInfoMessage));
            } else {
                system.log(insufficientInfoMessage, view, obj);
            }
            return;
        }

        if (!view.getAttribute) {
            if (viewModelBinder.throwOnErrors) {
                system.error(new Error(unexpectedViewMessage));
            } else {
                system.log(unexpectedViewMessage, view, obj);
            }
            return;
        }

        var viewName = view.getAttribute('data-view');

        try {
            system.log('Binding', viewName, obj);

            viewModelBinder.beforeBind(obj, view);
            action();
            viewModelBinder.afterBind(obj, view);
        } catch (e) {
            if (viewModelBinder.throwOnErrors) {
                system.error(new Error(e.message + ';\nView: ' + viewName + ";\nModuleId: " + system.getModuleId(obj)));
            } else {
                system.log(e.message, viewName, obj);
            }
        }
    }

    return viewModelBinder = {
        beforeBind: system.noop,
        afterBind: system.noop,
        bindContext: function (bindingContext, view, obj) {
            if (obj) {
                bindingContext = bindingContext.createChildContext(obj);
            }

            doBind(bindingContext, view, function () {
                if (obj && obj.beforeBind) {
                    obj.beforeBind(view);
                }

                ko.applyBindings(bindingContext, view);

                if (obj && obj.afterBind) {
                    obj.afterBind(view);
                }
            });
        },
        bind: function (obj, view) {
            doBind(obj, view, function () {
                if (obj.beforeBind) {
                    obj.beforeBind(view);
                }

                ko.applyBindings(obj, view);

                if (obj.afterBind) {
                    obj.afterBind(view);
                }
            });
        }
    };
});
define('durandal/viewModel', ['./system'], function (system) {
    var viewModel;

    function ensureSettings(settings) {
        if (settings == undefined) {
            settings = {};
        }

        if (!settings.closeOnDeactivate) {
            settings.closeOnDeactivate = viewModel.defaults.closeOnDeactivate;
        }

        if (!settings.beforeActivate) {
            settings.beforeActivate = viewModel.defaults.beforeActivate;
        }

        if (!settings.afterDeactivate) {
            settings.afterDeactivate = viewModel.defaults.afterDeactivate;
        }

        if (!settings.interpretResponse) {
            settings.interpretResponse = viewModel.defaults.interpretResponse;
        }

        if (!settings.areSameItem) {
            settings.areSameItem = viewModel.defaults.areSameItem;
        }

        return settings;
    }

    function deactivate(item, close, settings, dfd, setter) {
        if (item && item.deactivate) {
            system.log('Deactivating', item);

            var result;
            try {
                result = item.deactivate(close);
            } catch (error) {
                system.error(error);
                dfd.resolve(false);
                return;
            }

            if (result && result.then) {
                result.then(function () {
                    settings.afterDeactivate(item, close, setter);
                    dfd.resolve(true);
                }, function (reason) {
                    system.log(reason);
                    dfd.resolve(false);
                });
            } else {
                settings.afterDeactivate(item, close, setter);
                dfd.resolve(true);
            }
        } else {
            if (item) {
                settings.afterDeactivate(item, close, setter);
            }

            dfd.resolve(true);
        }
    }

    function activate(newItem, activeItem, callback, activationData) {
        if (newItem) {
            if (newItem.activate) {
                system.log('Activating', newItem);

                var result;
                try {
                    result = newItem.activate(activationData);
                } catch (error) {
                    system.error(error);
                    callback(false);
                    return;
                }

                if (result && result.then) {
                    result.then(function () {
                        activeItem(newItem);
                        callback(true);
                    }, function (reason) {
                        system.log(reason);
                        callback(false);
                    });
                } else {
                    activeItem(newItem);
                    callback(true);
                }
            } else {
                activeItem(newItem);
                callback(true);
            }
        } else {
            callback(true);
        }
    }

    function canDeactivateItem(item, close, settings) {
        return system.defer(function (dfd) {
            if (item && item.canDeactivate) {
                var resultOrPromise;
                try {
                    resultOrPromise = item.canDeactivate(close);
                } catch (error) {
                    system.error(error);
                    dfd.resolve(false);
                    return;
                }

                if (resultOrPromise.then) {
                    resultOrPromise.then(function (result) {
                        dfd.resolve(settings.interpretResponse(result));
                    }, function (reason) {
                        system.log(reason);
                        dfd.resolve(false);
                    });
                } else {
                    dfd.resolve(settings.interpretResponse(resultOrPromise));
                }
            } else {
                dfd.resolve(true);
            }
        }).promise();
    };

    function canActivateItem(newItem, activeItem, settings, activationData) {
        return system.defer(function (dfd) {
            if (newItem == activeItem()) {
                dfd.resolve(true);
                return;
            }

            if (newItem && newItem.canActivate) {
                var resultOrPromise;
                try {
                    resultOrPromise = newItem.canActivate(activationData);
                } catch (error) {
                    system.error(error);
                    dfd.resolve(false);
                    return;
                }

                if (resultOrPromise.then) {
                    resultOrPromise.then(function (result) {
                        dfd.resolve(settings.interpretResponse(result));
                    }, function (reason) {
                        system.log(reason);
                        dfd.resolve(false);
                    });
                } else {
                    dfd.resolve(settings.interpretResponse(resultOrPromise));
                }
            } else {
                dfd.resolve(true);
            }
        }).promise();
    };

    function createActivator(initialActiveItem, settings) {
        var activeItem = ko.observable(null);

        settings = ensureSettings(settings);

        var computed = ko.computed({
            read: function () {
                return activeItem();
            },
            write: function (newValue) {
                computed.viaSetter = true;
                computed.activateItem(newValue);
            }
        });

        computed.settings = settings;
        settings.activator = computed;

        computed.isActivating = ko.observable(false);

        computed.canDeactivateItem = function (item, close) {
            return canDeactivateItem(item, close, settings);
        };

        computed.deactivateItem = function (item, close) {
            return system.defer(function (dfd) {
                computed.canDeactivateItem(item, close).then(function (canDeactivate) {
                    if (canDeactivate) {
                        deactivate(item, close, settings, dfd, activeItem);
                    } else {
                        computed.notifySubscribers();
                        dfd.resolve(false);
                    }
                });
            }).promise();
        };

        computed.canActivateItem = function (newItem, activationData) {
            return canActivateItem(newItem, activeItem, settings, activationData);
        };

        computed.activateItem = function (newItem, activationData) {
            var viaSetter = computed.viaSetter;
            computed.viaSetter = false;

            return system.defer(function (dfd) {
                if (computed.isActivating()) {
                    dfd.resolve(false);
                    return;
                }

                computed.isActivating(true);

                var currentItem = activeItem();
                if (settings.areSameItem(currentItem, newItem, activationData)) {
                    computed.isActivating(false);
                    dfd.resolve(true);
                    return;
                }

                computed.canDeactivateItem(currentItem, settings.closeOnDeactivate).then(function (canDeactivate) {
                    if (canDeactivate) {
                        computed.canActivateItem(newItem, activationData).then(function (canActivate) {
                            if (canActivate) {
                                system.defer(function (dfd2) {
                                    deactivate(currentItem, settings.closeOnDeactivate, settings, dfd2);
                                }).promise().then(function () {
                                    newItem = settings.beforeActivate(newItem, activationData);
                                    activate(newItem, activeItem, function (result) {
                                        computed.isActivating(false);
                                        dfd.resolve(result);
                                    }, activationData);
                                });
                            } else {
                                if (viaSetter) {
                                    computed.notifySubscribers();
                                }

                                computed.isActivating(false);
                                dfd.resolve(false);
                            }
                        });
                    } else {
                        if (viaSetter) {
                            computed.notifySubscribers();
                        }

                        computed.isActivating(false);
                        dfd.resolve(false);
                    }
                });
            }).promise();
        };

        computed.canActivate = function () {
            var toCheck;

            if (initialActiveItem) {
                toCheck = initialActiveItem;
                initialActiveItem = false;
            } else {
                toCheck = computed();
            }

            return computed.canActivateItem(toCheck);
        };

        computed.activate = function () {
            var toActivate;

            if (initialActiveItem) {
                toActivate = initialActiveItem;
                initialActiveItem = false;
            } else {
                toActivate = computed();
            }

            return computed.activateItem(toActivate);
        };

        computed.canDeactivate = function (close) {
            return computed.canDeactivateItem(computed(), close);
        };

        computed.deactivate = function (close) {
            return computed.deactivateItem(computed(), close);
        };

        computed.includeIn = function (includeIn) {
            includeIn.canActivate = function () {
                return computed.canActivate();
            };

            includeIn.activate = function () {
                return computed.activate();
            };

            includeIn.canDeactivate = function (close) {
                return computed.canDeactivate(close);
            };

            includeIn.deactivate = function (close) {
                return computed.deactivate(close);
            };
        };

        if (settings.includeIn) {
            computed.includeIn(settings.includeIn);
        } else if (initialActiveItem) {
            computed.activate();
        }

        computed.forItems = function (items) {
            settings.closeOnDeactivate = false;

            settings.determineNextItemToActivate = function (list, lastIndex) {
                var toRemoveAt = lastIndex - 1;

                if (toRemoveAt == -1 && list.length > 1) {
                    return list[1];
                }

                if (toRemoveAt > -1 && toRemoveAt < list.length - 1) {
                    return list[toRemoveAt];
                }

                return null;
            };

            settings.beforeActivate = function (newItem) {
                var currentItem = computed();

                if (!newItem) {
                    newItem = settings.determineNextItemToActivate(items, currentItem ? items.indexOf(currentItem) : 0);
                } else {
                    var index = items.indexOf(newItem);

                    if (index == -1) {
                        items.push(newItem);
                    } else {
                        newItem = items()[index];
                    }
                }

                return newItem;
            };

            settings.afterDeactivate = function (oldItem, close) {
                if (close) {
                    items.remove(oldItem);
                }
            };

            var originalCanDeactivate = computed.canDeactivate;
            computed.canDeactivate = function (close) {
                if (close) {
                    return system.defer(function (dfd) {
                        var list = items();
                        var results = [];

                        function finish() {
                            for (var j = 0; j < results.length; j++) {
                                if (!results[j]) {
                                    dfd.resolve(false);
                                    return;
                                }
                            }

                            dfd.resolve(true);
                        }

                        for (var i = 0; i < list.length; i++) {
                            computed.canDeactivateItem(list[i], close).then(function (result) {
                                results.push(result);
                                if (results.length == list.length) {
                                    finish();
                                }
                            });
                        }
                    }).promise();
                } else {
                    return originalCanDeactivate();
                }
            };

            var originalDeactivate = computed.deactivate;
            computed.deactivate = function (close) {
                if (close) {
                    return system.defer(function (dfd) {
                        var list = items();
                        var results = 0;
                        var listLength = list.length;

                        function doDeactivate(item) {
                            computed.deactivateItem(item, close).then(function () {
                                results++;
                                items.remove(item);
                                if (results == listLength) {
                                    dfd.resolve();
                                }
                            });
                        }

                        for (var i = 0; i < listLength; i++) {
                            doDeactivate(list[i]);
                        }
                    }).promise();
                } else {
                    return originalDeactivate();
                }
            };

            return computed;
        };

        return computed;
    }

    return viewModel = {
        defaults: {
            closeOnDeactivate: true,
            interpretResponse: function (value) {
                if (typeof value == 'string') {
                    var lowered = value.toLowerCase();
                    return lowered == 'yes' || lowered == 'ok';
                }

                return value;
            },
            areSameItem: function (currentItem, newItem, activationData) {
                return currentItem == newItem;
            },
            beforeActivate: function (newItem) {
                return newItem;
            },
            afterDeactivate: function (item, close, setter) {
                if (close && setter) {
                    setter(null);
                }
            }
        },
        activator: createActivator
    };
});
define('durandal/composition', ['./viewLocator', './viewModelBinder', './viewEngine', './system', './viewModel'],
    function (viewLocator, viewModelBinder, viewEngine, system, viewModel) {

        var dummyModel = {},
            activeViewAttributeName = 'data-active-view';

        function shouldPerformActivation(settings) {
            return settings.model && settings.model.activate
                && ((composition.activateDuringComposition && settings.activate == undefined) || settings.activate);
        }

        function tryActivate(settings, successCallback) {
            if (shouldPerformActivation(settings)) {
                viewModel.activator().activateItem(settings.model).then(function (success) {
                    if (success) {
                        successCallback();
                    }
                });
            } else {
                successCallback();
            }
        }

        function getHostState(parent) {
            var elements = [];
            var state = {
                childElements: elements,
                activeView: null
            };

            var child = ko.virtualElements.firstChild(parent);

            while (child) {
                if (child.nodeType == 1) {
                    elements.push(child);
                    if (child.getAttribute(activeViewAttributeName)) {
                        state.activeView = child;
                    }
                }

                child = ko.virtualElements.nextSibling(child);
            }

            return state;
        }

        function afterContentSwitch(parent, newChild, settings) {
            if (settings.activeView) {
                settings.activeView.removeAttribute(activeViewAttributeName);
            }

            if (newChild) {
                if (settings.model && settings.model.viewAttached) {
                    if (settings.composingNewView || settings.alwaysAttachView) {
                        settings.model.viewAttached(newChild);
                    }
                }

                newChild.setAttribute(activeViewAttributeName, true);
            }

            if (settings.afterCompose) {
                settings.afterCompose(parent, newChild, settings);
            }
        }

        function shouldTransition(newChild, settings) {
            if (typeof settings.transition == 'string') {
                if (settings.activeView) {
                    if (settings.activeView == newChild) {
                        return false;
                    }

                    if (!newChild) {
                        return true;
                    }

                    if (settings.skipTransitionOnSameViewId) {
                        var currentViewId = settings.activeView.getAttribute('data-view');
                        var newViewId = newChild.getAttribute('data-view');
                        return currentViewId != newViewId;
                    }
                }

                return true;
            }

            return false;
        }

        var composition = {
            activateDuringComposition: false,
            convertTransitionToModuleId: function (name) {
                return 'durandal/transitions/' + name;
            },
            switchContent: function (parent, newChild, settings) {
                settings.transition = settings.transition || this.defaultTransitionName;

                if (shouldTransition(newChild, settings)) {
                    var transitionModuleId = this.convertTransitionToModuleId(settings.transition);
                    system.acquire(transitionModuleId).then(function (transition) {
                        settings.transition = transition;
                        transition(parent, newChild, settings).then(function () {
                            afterContentSwitch(parent, newChild, settings);
                        });
                    });
                } else {
                    if (newChild != settings.activeView) {
                        if (settings.cacheViews && settings.activeView) {
                            $(settings.activeView).css('display', 'none');
                        }

                        if (!newChild) {
                            if (!settings.cacheViews) {
                                ko.virtualElements.emptyNode(parent);
                            }
                        } else {
                            if (settings.cacheViews) {
                                if (settings.composingNewView) {
                                    settings.viewElements.push(newChild);
                                    ko.virtualElements.prepend(parent, newChild);
                                } else {
                                    $(newChild).css('display', '');
                                }
                            } else {
                                ko.virtualElements.emptyNode(parent);
                                ko.virtualElements.prepend(parent, newChild);
                            }
                        }
                    }

                    afterContentSwitch(parent, newChild, settings);
                }
            },
            bindAndShow: function (element, view, settings) {
                if (settings.cacheViews) {
                    settings.composingNewView = (ko.utils.arrayIndexOf(settings.viewElements, view) == -1);
                } else {
                    settings.composingNewView = true;
                }

                tryActivate(settings, function () {
                    if (settings.beforeBind) {
                        settings.beforeBind(element, view, settings);
                    }

                    if (settings.preserveContext && settings.bindingContext) {
                        if (settings.composingNewView) {
                            viewModelBinder.bindContext(settings.bindingContext, view, settings.model);
                        }
                    } else if (view) {
                        var modelToBind = settings.model || dummyModel;
                        var currentModel = ko.dataFor(view);

                        if (currentModel != modelToBind) {
                            if (!settings.composingNewView) {
                                $(view).remove();
                                viewEngine.createView(view.getAttribute('data-view')).then(function (recreatedView) {
                                    composition.bindAndShow(element, recreatedView, settings);
                                });
                                return;
                            }
                            viewModelBinder.bind(modelToBind, view);
                        }
                    }

                    composition.switchContent(element, view, settings);
                });
            },
            defaultStrategy: function (settings) {
                return viewLocator.locateViewForObject(settings.model, settings.viewElements);
            },
            getSettings: function (valueAccessor, element) {
                var value = ko.utils.unwrapObservable(valueAccessor()) || {};

                if (typeof value == 'string') {
                    return value;
                }

                var moduleId = system.getModuleId(value);
                if (moduleId) {
                    return {
                        model: value
                    };
                }

                for (var attrName in value) {
                    value[attrName] = ko.utils.unwrapObservable(value[attrName]);
                }

                return value;
            },
            executeStrategy: function (element, settings) {
                settings.strategy(settings).then(function (view) {
                    composition.bindAndShow(element, view, settings);
                });
            },
            inject: function (element, settings) {
                if (!settings.model) {
                    this.bindAndShow(element, null, settings);
                    return;
                }

                if (settings.view) {
                    viewLocator.locateView(settings.view, settings.area, settings.viewElements).then(function (view) {
                        composition.bindAndShow(element, view, settings);
                    });
                    return;
                }

                if (settings.view !== undefined && !settings.view) {
                    return;
                }

                if (!settings.strategy) {
                    settings.strategy = this.defaultStrategy;
                }

                if (typeof settings.strategy == 'string') {
                    system.acquire(settings.strategy).then(function (strategy) {
                        settings.strategy = strategy;
                        composition.executeStrategy(element, settings);
                    });
                } else {
                    this.executeStrategy(element, settings);
                }
            },
            compose: function (element, settings, bindingContext) {
                if (typeof settings == 'string') {
                    if (viewEngine.isViewUrl(settings)) {
                        settings = {
                            view: settings
                        };
                    } else {
                        settings = {
                            model: settings
                        };
                    }
                }

                var moduleId = system.getModuleId(settings);
                if (moduleId) {
                    settings = {
                        model: settings
                    };
                }

                var hostState = getHostState(element);

                settings.bindingContext = bindingContext;
                settings.activeView = hostState.activeView;

                if (settings.cacheViews && !settings.viewElements) {
                    settings.viewElements = hostState.childElements;
                }

                if (!settings.model) {
                    if (!settings.view) {
                        this.bindAndShow(element, null, settings);
                    } else {
                        settings.area = settings.area || 'partial';
                        settings.preserveContext = true;

                        viewLocator.locateView(settings.view, settings.area, settings.viewElements).then(function (view) {
                            composition.bindAndShow(element, view, settings);
                        });
                    }
                } else if (typeof settings.model == 'string') {
                    system.acquire(settings.model).then(function (module) {
                        if (typeof (module) == 'function') {
                            settings.model = new module(element, settings);
                        } else {
                            settings.model = module;
                        }

                        composition.inject(element, settings);
                    });
                } else {
                    composition.inject(element, settings);
                }
            }
        };

        ko.bindingHandlers.compose = {
            update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                var settings = composition.getSettings(valueAccessor);
                composition.compose(element, settings, bindingContext);
            }
        };

        ko.virtualElements.allowedBindings.compose = true;

        return composition;
    });
define('durandal/widget', ['./system', './composition'], function (system, composition) {

    var widgetPartAttribute = 'data-part',
        widgetPartSelector = '[' + widgetPartAttribute + ']';

    var kindModuleMaps = {},
        kindViewMaps = {},
        bindableSettings = ['model', 'view', 'kind'];

    var widget = {
        getParts: function (elements) {
            var parts = {};

            if (!system.isArray(elements)) {
                elements = [elements];
            }

            for (var i = 0; i < elements.length; i++) {
                var element = elements[i];

                if (element.getAttribute) {
                    var id = element.getAttribute(widgetPartAttribute);
                    if (id) {
                        parts[id] = element;
                    }

                    var childParts = $(widgetPartSelector, element);

                    for (var j = 0; j < childParts.length; j++) {
                        var part = childParts.get(j);
                        parts[part.getAttribute(widgetPartAttribute)] = part;
                    }
                }
            }

            return parts;
        },
        getSettings: function (valueAccessor) {
            var value = ko.utils.unwrapObservable(valueAccessor()) || {};

            if (typeof value == 'string') {
                return value;
            } else {
                for (var attrName in value) {
                    if (ko.utils.arrayIndexOf(bindableSettings, attrName) != -1) {
                        value[attrName] = ko.utils.unwrapObservable(value[attrName]);
                    } else {
                        value[attrName] = value[attrName];
                    }
                }
            }

            return value;
        },
        registerKind: function (kind) {
            ko.bindingHandlers[kind] = {
                init: function () {
                    return { controlsDescendantBindings: true };
                },
                update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
                    var settings = widget.getSettings(valueAccessor);
                    settings.kind = kind;
                    widget.create(element, settings, bindingContext);
                }
            };

            ko.virtualElements.allowedBindings[kind] = true;
        },
        mapKind: function (kind, viewId, moduleId) {
            if (viewId) {
                kindViewMaps[kind] = viewId;
            }

            if (moduleId) {
                kindModuleMaps[kind] = moduleId;
            }
        },
        convertKindToModuleId: function (kind) {
            return kindModuleMaps[kind] || 'durandal/widgets/' + kind + '/controller';
        },
        convertKindToViewId: function (kind) {
            return kindViewMaps[kind] || 'durandal/widgets/' + kind + '/view';
        },
        beforeBind: function (element, view, settings) {
            var replacementParts = widget.getParts(element);
            var standardParts = widget.getParts(view);

            for (var partId in replacementParts) {
                $(standardParts[partId]).replaceWith(replacementParts[partId]);
            }
        },
        createCompositionSettings: function (settings) {
            if (!settings.model) {
                settings.model = this.convertKindToModuleId(settings.kind);
            }

            if (!settings.view) {
                settings.view = this.convertKindToViewId(settings.kind);
            }

            settings.preserveContext = true;
            settings.beforeBind = this.beforeBind;

            return settings;
        },
        create: function (element, settings, bindingContext) {
            if (typeof settings == 'string') {
                settings = {
                    kind: settings
                };
            }

            var compositionSettings = widget.createCompositionSettings(settings);
            composition.compose(element, compositionSettings, bindingContext);
        }
    };

    ko.bindingHandlers.widget = {
        init: function () {
            return { controlsDescendantBindings: true };
        },
        update: function (element, valueAccessor, allBindingsAccessor, viewModel, bindingContext) {
            var settings = widget.getSettings(valueAccessor);
            widget.create(element, settings, bindingContext);
        }
    };

    ko.virtualElements.allowedBindings.widget = true;

    return widget;
});
define('durandal/modalDialog', ['./composition', './system', './viewModel'],
    function (composition, system, viewModel) {

        var contexts = {},
            modalCount = 0;

        function ensureModalInstance(objOrModuleId) {
            return system.defer(function (dfd) {
                if (typeof objOrModuleId == "string") {
                    system.acquire(objOrModuleId).then(function (module) {
                        if (typeof (module) == 'function') {
                            dfd.resolve(new module());
                        } else {
                            dfd.resolve(module);
                        }
                    });
                } else {
                    dfd.resolve(objOrModuleId);
                }
            }).promise();
        }

        var modalDialog = {
            currentZIndex: 1050,
            getNextZIndex: function () {
                return ++this.currentZIndex;
            },
            isModalOpen: function () {
                return modalCount > 0;
            },
            getContext: function (name) {
                return contexts[name || 'default'];
            },
            addContext: function (name, modalContext) {
                modalContext.name = name;
                contexts[name] = modalContext;

                var helperName = 'show' + name.substr(0, 1).toUpperCase() + name.substr(1);
                this[helperName] = function (obj, activationData) {
                    return this.show(obj, activationData, name);
                };
            },
            createCompositionSettings: function (obj, modalContext) {
                var settings = {
                    model: obj,
                    activate: false
                };

                if (modalContext.afterCompose) {
                    settings.afterCompose = modalContext.afterCompose;
                }

                return settings;
            },
            show: function (obj, activationData, context) {
                var that = this;
                var modalContext = contexts[context || 'default'];

                return system.defer(function (dfd) {
                    ensureModalInstance(obj).then(function (instance) {
                        var activator = viewModel.activator();

                        activator.activateItem(instance, activationData).then(function (success) {
                            if (success) {
                                var modal = instance.modal = {
                                    owner: instance,
                                    context: modalContext,
                                    activator: activator,
                                    close: function () {
                                        var args = arguments;
                                        activator.deactivateItem(instance, true).then(function (closeSuccess) {
                                            if (closeSuccess) {
                                                modalCount--;
                                                modalContext.removeHost(modal);
                                                delete instance.modal;
                                                dfd.resolve.apply(dfd, args);
                                            }
                                        });
                                    }
                                };

                                modal.settings = that.createCompositionSettings(instance, modalContext);
                                modalContext.addHost(modal);

                                modalCount++;
                                composition.compose(modal.host, modal.settings);
                            } else {
                                dfd.resolve(false);
                            }
                        });
                    });
                }).promise();
            }
        };

        modalDialog.addContext('default', {
            blockoutOpacity: .2,
            removeDelay: 200,
            addHost: function (modal) {
                var body = $('body');
                var blockout = $('<div class="modalBlockout"></div>')
                    .css({ 'z-index': modalDialog.getNextZIndex(), 'opacity': this.blockoutOpacity })
                    .appendTo(body);

                var host = $('<div class="modalHost"></div>')
                    .css({ 'z-index': modalDialog.getNextZIndex() })
                    .appendTo(body);

                modal.host = host.get(0);
                modal.blockout = blockout.get(0);

                if (!modalDialog.isModalOpen()) {
                    modal.oldBodyMarginRight = $("body").css("margin-right");

                    var html = $("html");
                    var oldBodyOuterWidth = body.outerWidth(true);
                    var oldScrollTop = html.scrollTop();
                    $("html").css("overflow-y", "hidden");
                    var newBodyOuterWidth = $("body").outerWidth(true);
                    body.css("margin-right", (newBodyOuterWidth - oldBodyOuterWidth + parseInt(modal.oldBodyMarginRight)) + "px");
                    html.scrollTop(oldScrollTop); // necessary for Firefox
                    $("#simplemodal-overlay").css("width", newBodyOuterWidth + "px");
                }
            },
            removeHost: function (modal) {
                $(modal.host).css('opacity', 0);
                $(modal.blockout).css('opacity', 0);

                setTimeout(function () {
                    $(modal.host).remove();
                    $(modal.blockout).remove();
                }, this.removeDelay);

                if (!modalDialog.isModalOpen()) {
                    var html = $("html");
                    var oldScrollTop = html.scrollTop(); // necessary for Firefox.
                    html.css("overflow-y", "").scrollTop(oldScrollTop);
                    $("body").css("margin-right", modal.oldBodyMarginRight);
                }
            },
            afterCompose: function (parent, newChild, settings) {
                var $child = $(newChild);
                var width = $child.width();
                var height = $child.height();

                $child.css({
                    'margin-top': (-height / 2).toString() + 'px',
                    'margin-left': (-width / 2).toString() + 'px'
                });

                $(settings.model.modal.host).css('opacity', 1);

                if ($(newChild).hasClass('autoclose')) {
                    $(settings.model.modal.blockout).click(function () {
                        settings.model.modal.close();
                    });
                }

                $('.autofocus', newChild).each(function () {
                    $(this).focus();
                });
            }
        });

        return modalDialog;
    });
//heavily borrowed from backbone events, augmented by signals.js, added a little of my own code, cleaned up for better readability
define('durandal/events', ['./system'], function (system) {
    var eventSplitter = /\s+/;
    var Events = function () { };

    var Subscription = function (owner, events) {
        this.owner = owner;
        this.events = events;
    };

    Subscription.prototype.then = function (callback, context) {
        this.callback = callback || this.callback;
        this.context = context || this.context;

        if (!this.callback) {
            return this;
        }

        this.owner.on(this.events, this.callback, this.context);
        return this;
    };

    Subscription.prototype.on = Subscription.prototype.then;

    Subscription.prototype.off = function () {
        this.owner.off(this.events, this.callback, this.context);
        return this;
    };

    Events.prototype.on = function (events, callback, context) {
        var calls, event, list;

        if (!callback) {
            return new Subscription(this, events);
        } else {
            calls = this.callbacks || (this.callbacks = {});
            events = events.split(eventSplitter);

            while (event = events.shift()) {
                list = calls[event] || (calls[event] = []);
                list.push(callback, context);
            }

            return this;
        }
    };

    Events.prototype.off = function (events, callback, context) {
        var event, calls, list, i;

        // No events
        if (!(calls = this.callbacks)) {
            return this;
        }

        //removing all
        if (!(events || callback || context)) {
            delete this.callbacks;
            return this;
        }

        events = events ? events.split(eventSplitter) : system.keys(calls);

        // Loop through the callback list, splicing where appropriate.
        while (event = events.shift()) {
            if (!(list = calls[event]) || !(callback || context)) {
                delete calls[event];
                continue;
            }

            for (i = list.length - 2; i >= 0; i -= 2) {
                if (!(callback && list[i] !== callback || context && list[i + 1] !== context)) {
                    list.splice(i, 2);
                }
            }
        }

        return this;
    };

    Events.prototype.trigger = function (events) {
        var event, calls, list, i, length, args, all, rest;
        if (!(calls = this.callbacks)) {
            return this;
        }

        rest = [];
        events = events.split(eventSplitter);
        for (i = 1, length = arguments.length; i < length; i++) {
            rest[i - 1] = arguments[i];
        }

        // For each event, walk through the list of callbacks twice, first to
        // trigger the event, then to trigger any `"all"` callbacks.
        while (event = events.shift()) {
            // Copy callback lists to prevent modification.
            if (all = calls.all) {
                all = all.slice();
            }

            if (list = calls[event]) {
                list = list.slice();
            }

            // Execute event callbacks.
            if (list) {
                for (i = 0, length = list.length; i < length; i += 2) {
                    list[i].apply(list[i + 1] || this, rest);
                }
            }

            // Execute "all" callbacks.
            if (all) {
                args = [event].concat(rest);
                for (i = 0, length = all.length; i < length; i += 2) {
                    all[i].apply(all[i + 1] || this, args);
                }
            }
        }

        return this;
    };

    Events.prototype.proxy = function (events) {
        var that = this;
        return (function (arg) {
            that.trigger(events, arg);
        });
    };

    Events.includeIn = function (targetObject) {
        targetObject.on = Events.prototype.on;
        targetObject.off = Events.prototype.off;
        targetObject.trigger = Events.prototype.trigger;
        targetObject.proxy = Events.prototype.proxy;
    };

    return Events;
});
define('durandal/app', ['./system', './viewEngine', './composition', './widget', './modalDialog', './events'],
    function (system, viewEngine, composition, widget, modalDialog, Events) {

        var app = {
            title: 'Application',
            showModal: function (obj, activationData, context) {
                return modalDialog.show(obj, activationData, context);
            },
            showMessage: function (message, title, options) {
                return modalDialog.show('./messageBox', {
                    message: message,
                    title: title || this.title,
                    options: options
                });
            },
            start: function () {
                var that = this;
                if (that.title) {
                    document.title = that.title;
                }

                return system.defer(function (dfd) {
                    $(function () {
                        system.log('Starting Application');
                        dfd.resolve();
                        system.log('Started Application');
                    });
                }).promise();
            },
            setRoot: function (root, transition, applicationHost) {
                var hostElement, settings = { activate: true, transition: transition };

                if (!applicationHost || typeof applicationHost == "string") {
                    hostElement = document.getElementById(applicationHost || 'applicationHost');
                } else {
                    hostElement = applicationHost;
                }

                if (typeof root === 'string') {
                    if (viewEngine.isViewUrl(root)) {
                        settings.view = root;
                    } else {
                        settings.model = root;
                    }
                } else {
                    settings.model = root;
                }

                composition.compose(hostElement, settings);
            },
            adaptToDevice: function () {
                document.ontouchmove = function (event) {
                    event.preventDefault();
                };
            }
        };

        Events.includeIn(app);

        return app;
    });
define('durandal/http', [], function () {
    return {
        defaultJSONPCallbackParam: 'callback',
        get: function (url, query) {
            return $.ajax(url, { data: query });
        },
        jsonp: function (url, query, callbackParam) {
            if (url.indexOf('=?') == -1) {
                callbackParam = callbackParam || this.defaultJSONPCallbackParam;

                if (url.indexOf('?') == -1) {
                    url += '?';
                } else {
                    url += '&';
                }

                url += callbackParam + '=?';
            }

            return $.ajax({
                url: url,
                dataType: 'jsonp',
                data: query
            });
        },
        post: function (url, data) {
            return $.ajax({
                url: url,
                data: ko.toJSON(data),
                type: 'POST',
                contentType: 'application/json',
                dataType: 'json'
            });
        }
    };
});
/**
 * @license RequireJS text 2.0.3 Copyright (c) 2010-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/requirejs/text for details
 */
/*jslint regexp: true */
/*global require: false, XMLHttpRequest: false, ActiveXObject: false,
  define: false, window: false, process: false, Packages: false,
  java: false, location: false */

define('text', ['module'], function (module) {


    var text, fs,
        progIds = ['Msxml2.XMLHTTP', 'Microsoft.XMLHTTP', 'Msxml2.XMLHTTP.4.0'],
        xmlRegExp = /^\s*<\?xml(\s)+version=[\'\"](\d)*.(\d)*[\'\"](\s)*\?>/im,
        bodyRegExp = /<body[^>]*>\s*([\s\S]+)\s*<\/body>/im,
        hasLocation = typeof location !== 'undefined' && location.href,
        defaultProtocol = hasLocation && location.protocol && location.protocol.replace(/\:/, ''),
        defaultHostName = hasLocation && location.hostname,
        defaultPort = hasLocation && (location.port || undefined),
        buildMap = [],
        masterConfig = (module.config && module.config()) || {};

    text = {
        version: '2.0.3',

        strip: function (content) {
            //Strips <?xml ...?> declarations so that external SVG and XML
            //documents can be added to a document without worry. Also, if the string
            //is an HTML document, only the part inside the body tag is returned.
            if (content) {
                content = content.replace(xmlRegExp, "");
                var matches = content.match(bodyRegExp);
                if (matches) {
                    content = matches[1];
                }
            } else {
                content = "";
            }
            return content;
        },

        jsEscape: function (content) {
            return content.replace(/(['\\])/g, '\\$1')
                .replace(/[\f]/g, "\\f")
                .replace(/[\b]/g, "\\b")
                .replace(/[\n]/g, "\\n")
                .replace(/[\t]/g, "\\t")
                .replace(/[\r]/g, "\\r")
                .replace(/[\u2028]/g, "\\u2028")
                .replace(/[\u2029]/g, "\\u2029");
        },

        createXhr: masterConfig.createXhr || function () {
            //Would love to dump the ActiveX crap in here. Need IE 6 to die first.
            var xhr, i, progId;
            if (typeof XMLHttpRequest !== "undefined") {
                return new XMLHttpRequest();
            } else if (typeof ActiveXObject !== "undefined") {
                for (i = 0; i < 3; i += 1) {
                    progId = progIds[i];
                    try {
                        xhr = new ActiveXObject(progId);
                    } catch (e) { }

                    if (xhr) {
                        progIds = [progId];  // so faster next time
                        break;
                    }
                }
            }

            return xhr;
        },

        /**
         * Parses a resource name into its component parts. Resource names
         * look like: module/name.ext!strip, where the !strip part is
         * optional.
         * @param {String} name the resource name
         * @returns {Object} with properties "moduleName", "ext" and "strip"
         * where strip is a boolean.
         */
        parseName: function (name) {
            var strip = false, index = name.indexOf("."),
                modName = name.substring(0, index),
                ext = name.substring(index + 1, name.length);

            index = ext.indexOf("!");
            if (index !== -1) {
                //Pull off the strip arg.
                strip = ext.substring(index + 1, ext.length);
                strip = strip === "strip";
                ext = ext.substring(0, index);
            }

            return {
                moduleName: modName,
                ext: ext,
                strip: strip
            };
        },

        xdRegExp: /^((\w+)\:)?\/\/([^\/\\]+)/,

        /**
         * Is an URL on another domain. Only works for browser use, returns
         * false in non-browser environments. Only used to know if an
         * optimized .js version of a text resource should be loaded
         * instead.
         * @param {String} url
         * @returns Boolean
         */
        useXhr: function (url, protocol, hostname, port) {
            var uProtocol, uHostName, uPort,
                match = text.xdRegExp.exec(url);
            if (!match) {
                return true;
            }
            uProtocol = match[2];
            uHostName = match[3];

            uHostName = uHostName.split(':');
            uPort = uHostName[1];
            uHostName = uHostName[0];

            return (!uProtocol || uProtocol === protocol) &&
                   (!uHostName || uHostName.toLowerCase() === hostname.toLowerCase()) &&
                   ((!uPort && !uHostName) || uPort === port);
        },

        finishLoad: function (name, strip, content, onLoad) {
            content = strip ? text.strip(content) : content;
            if (masterConfig.isBuild) {
                buildMap[name] = content;
            }
            onLoad(content);
        },

        load: function (name, req, onLoad, config) {
            //Name has format: some.module.filext!strip
            //The strip part is optional.
            //if strip is present, then that means only get the string contents
            //inside a body tag in an HTML string. For XML/SVG content it means
            //removing the <?xml ...?> declarations so the content can be inserted
            //into the current doc without problems.

            // Do not bother with the work if a build and text will
            // not be inlined.
            if (config.isBuild && !config.inlineText) {
                onLoad();
                return;
            }

            masterConfig.isBuild = config.isBuild;

            var parsed = text.parseName(name),
                nonStripName = parsed.moduleName + '.' + parsed.ext,
                url = req.toUrl(nonStripName),
                useXhr = (masterConfig.useXhr) ||
                         text.useXhr;

            //Load the text. Use XHR if possible and in a browser.
            if (!hasLocation || useXhr(url, defaultProtocol, defaultHostName, defaultPort)) {
                text.get(url, function (content) {
                    text.finishLoad(name, parsed.strip, content, onLoad);
                }, function (err) {
                    if (onLoad.error) {
                        onLoad.error(err);
                    }
                });
            } else {
                //Need to fetch the resource across domains. Assume
                //the resource has been optimized into a JS module. Fetch
                //by the module name + extension, but do not include the
                //!strip part to avoid file system issues.
                req([nonStripName], function (content) {
                    text.finishLoad(parsed.moduleName + '.' + parsed.ext,
                                    parsed.strip, content, onLoad);
                });
            }
        },

        write: function (pluginName, moduleName, write, config) {
            if (buildMap.hasOwnProperty(moduleName)) {
                var content = text.jsEscape(buildMap[moduleName]);
                write.asModule(pluginName + "!" + moduleName,
                               "define(function () { return '" +
                                   content +
                               "';});\n");
            }
        },

        writeFile: function (pluginName, moduleName, req, write, config) {
            var parsed = text.parseName(moduleName),
                nonStripName = parsed.moduleName + '.' + parsed.ext,
                //Use a '.js' file name so that it indicates it is a
                //script that can be loaded across domains.
                fileName = req.toUrl(parsed.moduleName + '.' +
                                     parsed.ext) + '.js';

            //Leverage own load() method to load plugin value, but only
            //write out values that do not have the strip argument,
            //to avoid any potential issues with ! in file names.
            text.load(nonStripName, req, function (value) {
                //Use own write() method to construct full module value.
                //But need to create shell that translates writeFile's
                //write() to the right interface.
                var textWrite = function (contents) {
                    return write(fileName, contents);
                };
                textWrite.asModule = function (moduleName, contents) {
                    return write.asModule(moduleName, fileName, contents);
                };

                text.write(pluginName, nonStripName, textWrite, config);
            }, config);
        }
    };

    if (masterConfig.env === 'node' || (!masterConfig.env &&
            typeof process !== "undefined" &&
            process.versions &&
            !!process.versions.node)) {
        //Using special require.nodeRequire, something added by r.js.
        fs = require.nodeRequire('fs');

        text.get = function (url, callback) {
            var file = fs.readFileSync(url, 'utf8');
            //Remove BOM (Byte Mark Order) from utf8 files if it is there.
            if (file.indexOf('\uFEFF') === 0) {
                file = file.substring(1);
            }
            callback(file);
        };
    } else if (masterConfig.env === 'xhr' || (!masterConfig.env &&
            text.createXhr())) {
        text.get = function (url, callback, errback) {
            var xhr = text.createXhr();
            xhr.open('GET', url, true);

            //Allow overrides specified in config
            if (masterConfig.onXhr) {
                masterConfig.onXhr(xhr, url);
            }

            xhr.onreadystatechange = function (evt) {
                var status, err;
                //Do not explicitly handle errors, those should be
                //visible via console output in the browser.
                if (xhr.readyState === 4) {
                    status = xhr.status;
                    if (status > 399 && status < 600) {
                        //An http 4xx or 5xx error. Signal an error.
                        err = new Error(url + ' HTTP status: ' + status);
                        err.xhr = xhr;
                        errback(err);
                    } else {
                        callback(xhr.responseText);
                    }
                }
            };
            xhr.send(null);
        };
    } else if (masterConfig.env === 'rhino' || (!masterConfig.env &&
            typeof Packages !== 'undefined' && typeof java !== 'undefined')) {
        //Why Java, why is this so awkward?
        text.get = function (url, callback) {
            var stringBuffer, line,
                encoding = "utf-8",
                file = new java.io.File(url),
                lineSeparator = java.lang.System.getProperty("line.separator"),
                input = new java.io.BufferedReader(new java.io.InputStreamReader(new java.io.FileInputStream(file), encoding)),
                content = '';
            try {
                stringBuffer = new java.lang.StringBuffer();
                line = input.readLine();

                // Byte Order Mark (BOM) - The Unicode Standard, version 3.0, page 324
                // http://www.unicode.org/faq/utf_bom.html

                // Note that when we use utf-8, the BOM should appear as "EF BB BF", but it doesn't due to this bug in the JDK:
                // http://bugs.sun.com/bugdatabase/view_bug.do?bug_id=4508058
                if (line && line.length() && line.charAt(0) === 0xfeff) {
                    // Eat the BOM, since we've already found the encoding on this file,
                    // and we plan to concatenating this buffer with others; the BOM should
                    // only appear at the top of a file.
                    line = line.substring(1);
                }

                stringBuffer.append(line);

                while ((line = input.readLine()) !== null) {
                    stringBuffer.append(lineSeparator);
                    stringBuffer.append(line);
                }
                //Make sure we return a JavaScript string and not a Java string.
                content = String(stringBuffer.toString()); //String
            } finally {
                input.close();
            }
            callback(content);
        };
    }

    return text;
});

define('text!durandal/messageBox.html', [], function () { return '<div class="messageBox">\r\n    <div class="modal-header">\r\n        <h3 data-bind="html: title"></h3>\r\n    </div>\r\n    <div class="modal-body">\r\n        <p class="message" data-bind="html: message"></p>\r\n    </div>\r\n    <div class="modal-footer" data-bind="foreach: options">\r\n        <button class="btn" data-bind="click: function () { $parent.selectOption($data); }, html: $data, css: { \'btn-primary\': $index() == 0, autofocus: $index() == 0 }"></button>\r\n    </div>\r\n</div>'; });

define('durandal/messageBox', [], function () {
    var MessageBox = function (message, title, options) {
        this.message = message;
        this.title = title || MessageBox.defaultTitle;
        this.options = options || MessageBox.defaultOptions;
    };

    MessageBox.prototype.selectOption = function (dialogResult) {
        this.modal.close(dialogResult);
    };

    MessageBox.prototype.activate = function (config) {
        if (config) {
            this.message = config.message;
            this.title = config.title || MessageBox.defaultTitle;
            this.options = config.options || MessageBox.defaultOptions;
        }
    };

    MessageBox.defaultTitle = 'Application';
    MessageBox.defaultOptions = ['Ok'];

    return MessageBox;
});
define('durandal/plugins/router', ['../system', '../viewModel', '../app'], function (system, viewModel, app) {

    //NOTE: Sammy.js is not required by the core of Durandal. 
    //However, this plugin leverages it to enable navigation.

    var routesByPath = {},
        allRoutes = ko.observableArray([]),
        visibleRoutes = ko.observableArray([]),
        ready = ko.observable(false),
        isNavigating = ko.observable(false),
        sammy,
        router,
        previousRoute,
        previousModule,
        cancelling = false,
        activeItem = viewModel.activator(),
        activeRoute = ko.observable(),
        navigationDefaultRoute,
        queue = [],
        skipRouteUrl;

    var tryActivateRouter = function () {
        tryActivateRouter = system.noop;
        ready(true);
        router.dfd.resolve();
        delete router.dfd;
    };

    activeItem.settings.areSameItem = function (currentItem, newItem, activationData) {
        return false;
    };

    function redirect(url) {
        isNavigating(false);
        system.log('Redirecting');
        router.navigateTo(url);
    }

    function cancelNavigation() {
        cancelling = true;
        system.log('Cancelling Navigation');

        if (previousRoute) {
            sammy.setLocation(previousRoute);
        }

        cancelling = false;
        isNavigating(false);

        var routeAttempted = sammy.last_location[1].split('#/')[1];

        if (previousRoute || !routeAttempted) {
            tryActivateRouter();
        } else if (routeAttempted != navigationDefaultRoute) {
            window.location.replace("#/" + navigationDefaultRoute);
        } else {
            tryActivateRouter();
        }
    }

    function completeNavigation(routeInfo, params, module) {
        activeRoute(routeInfo);
        router.onNavigationComplete(routeInfo, params, module);
        previousModule = module;
        previousRoute = sammy.last_location[1].replace('/', '');
        tryActivateRouter();
    }

    function activateRoute(routeInfo, params, module) {
        system.log('Activating Route', routeInfo, module, params);

        activeItem.activateItem(module, params).then(function (succeeded) {
            if (succeeded) {
                completeNavigation(routeInfo, params, module);
            } else {
                cancelNavigation();
            }
        });
    }

    function shouldStopNavigation() {
        return cancelling || (sammy.last_location[1].replace('/', '') == previousRoute);
    }

    function handleGuardedRoute(routeInfo, params, instance) {
        var resultOrPromise = router.guardRoute(routeInfo, params, instance);
        if (resultOrPromise) {
            if (resultOrPromise.then) {
                resultOrPromise.then(function (result) {
                    if (result) {
                        if (typeof result == 'string') {
                            redirect(result);
                        } else {
                            activateRoute(routeInfo, params, instance);
                        }
                    } else {
                        cancelNavigation();
                    }
                });
            } else {
                if (typeof resultOrPromise == 'string') {
                    redirect(resultOrPromise);
                } else {
                    activateRoute(routeInfo, params, instance);
                }
            }
        } else {
            cancelNavigation();
        }
    }

    function dequeueRoute() {
        if (isNavigating()) {
            return;
        }

        var next = queue.shift();
        queue = [];

        if (!next) {
            return;
        }

        isNavigating(true);

        system.acquire(next.routeInfo.moduleId).then(function (module) {
            next.params.routeInfo = next.routeInfo;
            next.params.router = router;

            var instance = router.getActivatableInstance(next.routeInfo, next.params, module);

            if (router.guardRoute) {
                handleGuardedRoute(next.routeInfo, next.params, instance);
            } else {
                activateRoute(next.routeInfo, next.params, instance);
            }
        });
    }

    function queueRoute(routeInfo, params) {
        queue.unshift({
            routeInfo: routeInfo,
            params: params
        });

        dequeueRoute();
    }

    function ensureRoute(route, params) {
        var routeInfo = routesByPath[route];

        if (shouldStopNavigation()) {
            return;
        }

        if (!routeInfo) {
            if (!router.autoConvertRouteToModuleId) {
                router.handleInvalidRoute(route, params);
                return;
            }

            var routeName = router.convertRouteToName(route);
            routeInfo = {
                moduleId: router.autoConvertRouteToModuleId(route, params),
                name: routeName,
                caption: routeName
            };
        }

        queueRoute(routeInfo, params);
    }

    function handleDefaultRoute() {
        ensureRoute(navigationDefaultRoute, this.params || {});
    }

    function handleMappedRoute() {
        ensureRoute(this.app.last_route.path.toString(), this.params || {});
    }

    function handleWildCardRoute() {
        var params = this.params || {}, route;

        if (router.autoConvertRouteToModuleId) {
            var fragment = this.path.split('#/');

            if (fragment.length == 2) {
                var parts = fragment[1].split('/');
                route = parts[0];
                params.splat = parts.splice(1);
                ensureRoute(route, params);
                return;
            }
        }

        router.handleInvalidRoute(this.app.last_location[1], params);
    }

    function configureRoute(routeInfo) {
        router.prepareRouteInfo(routeInfo);

        routesByPath[routeInfo.url.toString()] = routeInfo;
        allRoutes.push(routeInfo);

        if (routeInfo.visible) {
            routeInfo.isActive = ko.computed(function () {
                return ready() && activeItem() && activeItem().__moduleId__ == routeInfo.moduleId;
            });

            visibleRoutes.push(routeInfo);
        }

        return routeInfo;
    }

    return router = {
        ready: ready,
        allRoutes: allRoutes,
        visibleRoutes: visibleRoutes,
        isNavigating: isNavigating,
        activeItem: activeItem,
        activeRoute: activeRoute,
        afterCompose: function () {
            setTimeout(function () {
                isNavigating(false);
                dequeueRoute();
                router.onRouteComposed && router.onRouteComposed(router.activeRoute());
            }, 10);
        },
        getActivatableInstance: function (routeInfo, params, module) {
            if (typeof module == 'function') {
                return new module();
            } else {
                return module;
            }
        },
        useConvention: function (rootPath) {
            rootPath = rootPath == null ? 'viewmodels' : rootPath;
            if (rootPath) {
                rootPath += '/';
            }
            router.convertRouteToModuleId = function (url) {
                return rootPath + router.stripParameter(url);
            };
        },
        stripParameter: function (val) {
            var colonIndex = val.indexOf(':');
            var length = colonIndex > 0 ? colonIndex - 1 : val.length;
            return val.substring(0, length);
        },
        handleInvalidRoute: function (route, params) {
            system.log('No Route Found', route, params);
        },
        onNavigationComplete: function (routeInfo, params, module) {
            if (app.title) {
                document.title = routeInfo.caption + " | " + app.title;
            } else {
                document.title = routeInfo.caption;
            }
        },
        navigateBack: function () {
            window.history.back();
        },
        navigateTo: function (url, option) {
            option = option || 'trigger';

            switch (option.toLowerCase()) {
                case 'skip':
                    skipRouteUrl = url;
                    sammy.setLocation(url);
                    break;
                case 'replace':
                    window.location.replace(url);
                    break;
                default:
                    if (sammy.lookupRoute('get', url) && url.indexOf("http") !== 0) {
                        sammy.setLocation(url);
                    } else {
                        window.location.href = url;
                    }
                    break;
            }
        },
        navigateToRoute: function (url, data) {

            var newUrl = url;
            // find the hash using the url with parameters stripped 
            for (var route in routesByPath) {
                if (router.stripParameter(routesByPath[route].url) == url) {
                    newUrl = routesByPath[route].hash;
                    break;
                }
            }

            // if this is an url with parameters, add data.property for these parameters to the url
            var colonIndex = newUrl.indexOf(':');
            if (colonIndex > 0) {
                var paramstring = newUrl.substring(colonIndex - 1, newUrl.length);
                var params = paramstring.split('/:');
                newUrl = router.stripParameter(newUrl);
                for (var i = 0; i < params.length; i++) {
                    if (params[i]) {
                        newUrl += '/' + data[params[i]];
                    }
                }
            }

            sammy.setLocation(newUrl);
        },
        replaceLocation: function (url) {
            this.navigateTo(url, 'replace');
        },
        convertRouteToName: function (route) {
            var value = router.stripParameter(route);
            return value.substring(0, 1).toUpperCase() + value.substring(1);
        },
        convertRouteToModuleId: function (route) {
            return router.stripParameter(route);
        },
        prepareRouteInfo: function (info) {
            if (!(info.url instanceof RegExp)) {
                info.name = info.name || router.convertRouteToName(info.url);
                info.moduleId = info.moduleId || router.convertRouteToModuleId(info.url);
                info.hash = info.hash || '#/' + info.url;
            }

            info.caption = info.caption || info.name;
            info.settings = info.settings || {};
        },
        mapAuto: function (path) {
            path = path || 'viewmodels';
            path += '/';

            router.autoConvertRouteToModuleId = function (url, params) {
                return path + router.stripParameter(url);
            };
        },
        mapNav: function (urlOrConfig, moduleId, name) {
            if (typeof urlOrConfig == "string") {
                return this.mapRoute(urlOrConfig, moduleId, name, true);
            }

            urlOrConfig.visible = true;
            return configureRoute(urlOrConfig);
        },
        mapRoute: function (urlOrConfig, moduleId, name, visible) {
            if (typeof urlOrConfig == "string") {
                return configureRoute({
                    url: urlOrConfig,
                    moduleId: moduleId,
                    name: name,
                    visible: visible
                });
            } else {
                return configureRoute(urlOrConfig);
            }
        },
        map: function (routeOrRouteArray) {
            if (!system.isArray(routeOrRouteArray)) {
                return configureRoute(routeOrRouteArray);
            }

            var configured = [];
            for (var i = 0; i < routeOrRouteArray.length; i++) {
                configured.push(configureRoute(routeOrRouteArray[i]));
            }
            return configured;
        },
        deactivate: function () {
            router.allRoutes.removeAll();
            router.visibleRoutes.removeAll();
            sammy && sammy.destroy();
        },
        activate: function (defaultRoute) {
            return system.defer(function (dfd) {
                var processedRoute;

                router.dfd = dfd;
                navigationDefaultRoute = defaultRoute;

                sammy = Sammy(function (route) {
                    var unwrapped = allRoutes();

                    for (var i = 0; i < unwrapped.length; i++) {
                        var current = unwrapped[i];
                        route.get(current.url, handleMappedRoute);
                        processedRoute = this.routes.get[i];
                        routesByPath[processedRoute.path.toString()] = current;
                    }

                    route.get('#/', handleDefaultRoute);
                    route.get(/\#\/(.*)/, handleWildCardRoute);
                });

                sammy._checkFormSubmission = function () {
                    return false;
                };

                sammy.before(null, function (context) {
                    if (!skipRouteUrl) {
                        return true;
                    } else if (context.path === "/" + skipRouteUrl) {
                        skipRouteUrl = null;
                        return false;
                    } else {
                        system.error(new Error("Expected to skip url '" + skipRouteUrl + "', but found url '" + context.path + "'"));
                    }
                });

                sammy.log = function () {
                    var args = Array.prototype.slice.call(arguments, 0);
                    args.unshift('Sammy');
                    system.log.apply(system, args);
                };

                sammy.run('#/');
            }).promise();
        }
    };
});
Durandal.app = require('durandal/app');
Durandal.composition = require('durandal/composition');
Durandal.events = require('durandal/events');
Durandal.http = require('durandal/http');
Durandal.system = require('durandal/system');
Durandal.viewEngine = require('durandal/viewEngine');
Durandal.viewLocator = require('durandal/viewLocator');
Durandal.viewModel = require('durandal/viewModel');
Durandal.viewModelBinder = require('durandal/viewModelBinder');
Durandal.widget = require('durandal/widget');
Durandal.router = require('durandal/plugins/router');