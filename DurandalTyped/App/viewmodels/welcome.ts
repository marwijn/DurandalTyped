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

define('text!views/Welcome.html', [], function () { return '<section>\r\n    <h2 data-bind="html:displayName"></h2>\r\n    <blockquote data-bind="html:description"></blockquote>\r\n    <h3>Features</h3>\r\n    <ul data-bind="foreach: features">\r\n        <li data-bind="html: $data"></li>\r\n    </ul>\r\n    <div class="alert alert-success">\r\n      <h4>Read Me Please</h4>\r\n        For information about this template and for general documenation please visit <a href="http://www.durandaljs.com">the official site</a> and if you can\'t find \r\n        answers to your questions there, we hope you will join our <a href="https://groups.google.com/forum/?fromgroups#!forum/durandaljs">google group</a>.\r\n    </div>\r\n</section>'; });

/// this code should be generated 
Welcome.prototype['__classname__'] = 'Welcome';
Welcome.prototype['__constructorArguments__'] = [];

