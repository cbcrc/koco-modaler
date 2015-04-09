// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

define(['modaler', 'text!./modaler.html'],
    function(modaler, template) {
        'use strict';

        var ViewModel = function (params, componentInfo) {
            var self = this;

            self.modaler = modaler;
        };

        return {
            viewModel: {
                createViewModel: function(params, componentInfo) {
                    return new ViewModel(params, componentInfo);
                }
            },
            template: template
        };
    });