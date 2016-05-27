'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _kocoModaler = require('koco-modaler');

var _kocoModaler2 = _interopRequireDefault(_kocoModaler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var ViewModel = function ViewModel() /*componentInfo*/{
    var self = this;

    self.modaler = _kocoModaler2.default;
}; // Copyright (c) CBC/Radio-Canada. All rights reserved.
// Licensed under the MIT license. See LICENSE file in the project root for full license information.

exports.default = ViewModel;