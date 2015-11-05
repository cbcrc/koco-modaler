// Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

define(['modaler'],
    function(modaler) {
        'use strict';

        var ViewModel = function (/*componentInfo*/) {
            var self = this;

            self.modaler = modaler;
        };

        return ViewModel;
    });