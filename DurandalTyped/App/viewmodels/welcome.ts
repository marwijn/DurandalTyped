///<reference path='../../Scripts/typings/requirejs/require.d.ts'/>

class Welcome {

    constructor()
    {
    }
    displayName = 'Welcome to the Durandal Starter Kit!';
    description = 'Durandal is a cross-device, cross-platform client framework written in JavaScript and designed to make Single Page Applications (SPAs) easy to create and maintain.';
    features = [
        'Clean MV* Architecture',
        'JS & HTML Modularity',
        'Simple App Lifecycle',
        'Eventing, Modals, Message Boxes, etc.',
        'Navigation & Screen State Management',
        'Consistent Async Programming w/ Promises',
        'App Bundling and Optimization',
        'Use any Backend Technology',
        'Built on top of jQuery, Knockout & RequireJS',
        'Integrates with other libraries such as SammyJS & Bootstrap',
        'Make jQuery & Bootstrap widgets templatable and bindable (or build your own widgets).'
    ];

    viewAttached(view: any) {
       //you can get the view after it's bound and connected to it's parent dom node if you want
    }


}

/// this code should be generated 
Welcome.prototype['__classname__'] = 'Welcome';
Welcome.prototype['__constructorArguments__'] = [];

