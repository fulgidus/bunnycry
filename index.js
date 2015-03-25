"use strict";

module.exports = {
    "messages": {
        "Bus": require('./lib/messages/Bus')
    },
    "rest": {
        "InterfaceConstructor": require('./lib/rest/InterfaceConstructor'),
        "RestAdapter": require('./lib/rest/RestAdapter')
    },
    "ComposableViewModel": require('./lib/ComposableViewModel'),
    "Registry": require('./lib/Registry'),
    "ViewModel": require('./lib/ViewModel')
};