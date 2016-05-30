(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['knockout', 'koco-modaler'], factory);
    } else if (typeof exports !== "undefined") {
        factory(require('knockout'), require('koco-modaler'));
    } else {
        var mod = {
            exports: {}
        };
        factory(global.knockout, global.kocoModaler);
        global.modalBindingHandler = mod.exports;
    }
})(this, function (_knockout, _kocoModaler) {
    'use strict';

    var _knockout2 = _interopRequireDefault(_knockout);

    var _kocoModaler2 = _interopRequireDefault(_kocoModaler);

    function _interopRequireDefault(obj) {
        return obj && obj.__esModule ? obj : {
            default: obj
        };
    }

    // Simple use: modal: 'modal-name'
    // Advanced use: modal: { name: 'modal-name', params: { ..params to pass to the modal }, shown: func, closed: func, failed: func }

    // Options properties
    //  options.name: Name of the modal to be shown (must have been registered).
    //  options.params: Parameters to be passed to the modaler.show() function.
    //  options.shown: Function to be called when the modal has been shown.
    //  options.closed: Function to be called when the modal has been closed.
    // Copyright (c) CBC/Radio-Canada. All rights reserved.
    // Licensed under the MIT license. See LICENSE file in the project root for full license information.

    _knockout2.default.bindingHandlers.modal = {
        update: function update(element, valueAccessor) {
            var options = _knockout2.default.utils.unwrapObservable(valueAccessor());

            if (!options.name) {
                throw 'Modal opener binding handler requires a modal to be set.';
            }

            _knockout2.default.applyBindingsToNode(element, {
                click: function click() {
                    _kocoModaler2.default.show(options.name, options.params, options.shown).then(options.closed, options.failed).always(function () {
                        element.focus();
                    });
                }
            });
        }
    };
});