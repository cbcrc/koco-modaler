define(['knockout', 'modaler'],
    function(ko, modaler) {

    	// Settings properties
    	// 	settings.modal: Name of the modal to be shown (must have been registered).
    	//	settings.params: Parameters to be passed to the modaler.show() function.
    	//	settings.shown: Function to be called when the modal has been shown.
    	//	settings.closed: Function to be called when the modal has been closed.
        ko.bindingHandlers.modalerOpener = {
            update: function(element, valueAccessor) {
                var settings = ko.utils.unwrapObservable(valueAccessor());
                var modal = settings.modal;
                var params = settings.params;

                if (!modal) {
                	throw 'Modal opener binding handler requires a modal to be set.';
                }

                ko.utils.registerEventHandler(element, 'click', function(event) {
                	modaler.show(modal, params, settings.shown).then(function(data) {
                		if (settings.closed) {
                			settings.closed(data);
                		}

                		element.focus();
                	});
                });
            }
        };
    });
