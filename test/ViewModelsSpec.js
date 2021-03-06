"use strict";

var angular = require('angular'),
    mocks = require('angular-mocks'),
    module = window.module,
    inject = window.inject,
    Registry = require('../lib/Registry'),
    ViewModel = require('../lib/viewmodels/ViewModel'),
    ComposableViewModel = require('../lib/viewmodels/ComposableViewModel'),
    ToolbarViewModel = require('./fixtures/ToolbarViewModel'),
    Bus = require('../lib/messages/Bus');

angular.module('test', ['ngMock'])
    .value('Context', 'DEFAULT')
    .value('Namespace', 'DEFAULT')
    .service('Bus', Bus)
    .controller('ComposableViewModel', ComposableViewModel)
    .controller('ToolbarViewModel', ['Context', 'Namespace', 'Bus', ToolbarViewModel])
    .controller('ViewModel', ViewModel);

describe('ViewModels', function () {

    beforeEach(module('test'));

    var controllerProvider = null,
        rootScope = null,
        propertiesRegistry = null,
        eventsRegistry = null,
        viewModelsRegistry = null,
        bus = null;

    beforeEach(inject(function (_$controller_, _$rootScope_) {
        controllerProvider = _$controller_;
        rootScope = _$rootScope_;
        propertiesRegistry = new Registry();
        eventsRegistry = new Registry();
        viewModelsRegistry = new Registry();
        bus = new Bus();
    }));

    describe("when using a viewmodel", function () {

        it("should watch the property of a viewmodel", function () {
            var spy = jasmine.createSpy();
            propertiesRegistry.register('SampleContext', 'testProperty');
            bus.subscribe('SampleContext', 'testProperty', spy);
            var scope = rootScope.$new(),
                viewModel = controllerProvider('ViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'bus': bus
                });

            viewModel.testProperty = 20;
            scope.$digest();

            expect(spy).toHaveBeenCalledWith({newValue: 20, oldValue: 20});
            expect(spy.calls.count()).toBe(1);
        });

        it("should listen to an emit of an event", function () {
            var spy = jasmine.createSpy();
            eventsRegistry.register('SampleContext', 'testEvent');
            bus.subscribe('SampleContext', 'testEvent', spy);
            var scope = rootScope.$new(),
                viewModel = controllerProvider('ViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry
                });

            scope.$emit('testEvent', {test: 10});

            expect(spy).toHaveBeenCalledWith({data: {test: 10}});
            expect(spy.calls.count()).toBe(1);
        });
    });

    describe("when using a composable view model", function () {

        it("should compose a viewmodel into another", function () {
            viewModelsRegistry.register('SampleContext', 'toolbar', 'ToolbarViewModel');
            var scope = rootScope.$new(),
                composableViewModel = controllerProvider('ComposableViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'viewModelsRegistry': viewModelsRegistry,
                    'controllerFactory': controllerProvider
                });

            expect(composableViewModel.toolbar.order).toEqual('asc');
        });

        it("should compose a viewmodel into another by aligning the namespace", function () {
            viewModelsRegistry.register('SampleContext', 'Toolbar', 'ToolbarViewModel');
            var scope = rootScope.$new(),
                composableViewModel = controllerProvider('ComposableViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'viewModelsRegistry': viewModelsRegistry,
                    'controllerFactory': controllerProvider
                });

            expect(composableViewModel.toolbar.order).toEqual('asc');
        });

        it("should compose a viewmodel into another keeping the camel case namespace", function () {
            viewModelsRegistry.register('SampleContext', 'toolbarManagement', 'ToolbarViewModel');
            var scope = rootScope.$new(),
                composableViewModel = controllerProvider('ComposableViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'viewModelsRegistry': viewModelsRegistry,
                    'controllerFactory': controllerProvider
                });

            expect(composableViewModel.toolbarManagement.order).toEqual('asc');
        });

        it("should watch a property of a composed viewmodel", function () {
            var spy = jasmine.createSpy();
            propertiesRegistry.register('SampleContext', 'toolbar.order');
            bus.subscribe('SampleContext', 'toolbar.order', spy);
            viewModelsRegistry.register('SampleContext', 'Toolbar', 'ToolbarViewModel');
            var scope = rootScope.$new(),
                composableViewModel = controllerProvider('ComposableViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'viewModelsRegistry': viewModelsRegistry,
                    'controllerFactory': controllerProvider
                });

            composableViewModel.toolbar.order = 'desc';
            scope.$digest();

            expect(spy).toHaveBeenCalledWith({newValue: 'desc', oldValue: 'desc'});
            expect(spy.calls.count()).toBe(1);
        });

        it("should watch a property of a composed viewmodel during multiple digest cycles", function () {
            var spy = jasmine.createSpy();
            propertiesRegistry.register('SampleContext', 'toolbar.order');
            bus.subscribe('SampleContext', 'toolbar.order', spy);
            viewModelsRegistry.register('SampleContext', 'Toolbar', 'ToolbarViewModel');
            var scope = rootScope.$new(),
                composableViewModel = controllerProvider('ComposableViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'viewModelsRegistry': viewModelsRegistry,
                    'controllerFactory': controllerProvider
                });

            composableViewModel.toolbar.order = 'desc';
            scope.$digest();
            composableViewModel.toolbar.order = 'asc';
            scope.$digest();

            expect(spy).toHaveBeenCalledWith({newValue: 'desc', oldValue: 'desc'});
            expect(spy).toHaveBeenCalledWith({newValue: 'asc', oldValue: 'desc'});
            expect(spy.calls.count()).toBe(2);
        });

        it("should pass the context and the namespace to the viewmodel", function () {
            viewModelsRegistry.register('SampleContext', 'toolbar', 'ToolbarViewModel');
            var scope = rootScope.$new(),
                composableViewModel = controllerProvider('ComposableViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'viewModelsRegistry': viewModelsRegistry,
                    'controllerFactory': controllerProvider
                });

            expect(composableViewModel.toolbar._namespace).toEqual('toolbar');
            expect(composableViewModel.toolbar._context).toEqual('SampleContext');
        });

        it("should dispose all the viewmodels on scope destruction", function () {
            viewModelsRegistry.register('SampleContext', 'toolbar', 'ToolbarViewModel');
            var scope = rootScope.$new(),
                composableViewModel = controllerProvider('ComposableViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'viewModelsRegistry': viewModelsRegistry,
                    'controllerFactory': controllerProvider
                });
            spyOn(composableViewModel.toolbar, 'destroy');

            scope.$destroy();

            expect(composableViewModel.toolbar.destroy).toHaveBeenCalled();
        });

        it("should watch the property changes of a complex property", function () {
            var spy = jasmine.createSpy();
            propertiesRegistry.register('SampleContext', 'toolbar.complexProperty');
            bus.subscribe('SampleContext', 'toolbar.complexProperty', spy);
            viewModelsRegistry.register('SampleContext', 'Toolbar', 'ToolbarViewModel');
            var scope = rootScope.$new(),
                composableViewModel = controllerProvider('ComposableViewModel', {
                    'context': 'SampleContext',
                    'scope': scope,
                    'bus': bus,
                    'propertiesRegistry': propertiesRegistry,
                    'eventsRegistry': eventsRegistry,
                    'viewModelsRegistry': viewModelsRegistry,
                    'controllerFactory': controllerProvider
                });

            composableViewModel.toolbar.complexProperty.a.b = 'bar';
            scope.$digest();

            expect(spy).toHaveBeenCalledWith({newValue: {a: {b: 'bar'}}, oldValue: {a: {b: 'bar'}}});
        });
    });
});