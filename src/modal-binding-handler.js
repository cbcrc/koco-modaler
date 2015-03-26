define(['knockout', 'modaler'],
    function(ko, modaler) {
        'use strict';

        // Simple use: modal: 'modal-name'
        // Advanced use: modal: { name: 'modal-name', params: { ..params to pass to the modal }, shown: func, closed: func, failed: func }


        // Options properties
        //  options.name: Name of the modal to be shown (must have been registered).
        //  options.params: Parameters to be passed to the modaler.show() function.
        //  options.shown: Function to be called when the modal has been shown.
        //  options.closed: Function to be called when the modal has been closed.
        ko.bindingHandlers.modal = {
            update: function(element, valueAccessor) {
                var options = ko.utils.unwrapObservable(valueAccessor());

                if (!options.name) {
                    throw 'Modal opener binding handler requires a modal to be set.';
                }

                ko.applyBindingsToNode(element, {
                    click: function() {
                        modaler.show(options.name, options.params, options.shown)
                            .then(options.closed, options.failed)
                            .always(function() {
                                element.focus();
                            });
                    }
                });
            }
        };
    });
