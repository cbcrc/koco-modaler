'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

var _bootstrap = require('bootstrap');

var _bootstrap2 = _interopRequireDefault(_bootstrap);

var _knockout = require('knockout');

var _knockout2 = _interopRequireDefault(_knockout);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _kocoKnockoutUtilities = require('koco-knockout-utilities');

var _kocoKnockoutUtilities2 = _interopRequireDefault(_kocoKnockoutUtilities);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var KEYCODE_ESC = 27;

var TRANSITION_DURATION = 300;
if (_jquery2.default.fn.modal.Constructor && _jquery2.default.fn.modal.Constructor.TRANSITION_DURATION) {
    TRANSITION_DURATION = _jquery2.default.fn.modal.Constructor.TRANSITION_DURATION;
}

function Modaler() {
    var self = this;

    self.$document = (0, _jquery2.default)(document);

    _knockout2.default.components.register('modaler', {
        isBower: true
    });

    _knockout2.default.components.register('modal', {
        basePath: 'bower_components/koco-modaler/src',
        htmlOnly: true
    });

    self.modalConfigs = [];
    self.currentModal = _knockout2.default.observable(null);
    self.showModalQueue = [];

    self.isModalOpen = _knockout2.default.computed(function () {
        return !!self.currentModal();
    });

    self.focused = _knockout2.default.observable(false);

    self.isModalOpen.subscribe(function (isModalOpen) {
        registerOrUnregisterHideModalKeyboardShortcut(self, isModalOpen);
    });

    self.currentModalTitle = _knockout2.default.computed(function () {
        var currentModal = self.currentModal();

        if (currentModal) {
            return currentModal.title;
        }

        return '';
    });

    self.isModalOpening = _knockout2.default.observable(false);
    self.isModalHiding = _knockout2.default.observable(false);
}

//TODO: Passer $modalElement en argument au lieu
Modaler.prototype.init = function () /*config*/{
    var self = this;

    self.$modalElement = getModalElement();

    self.$modalElement.modal({
        show: false
    });
};

Modaler.prototype.show = function (name, params, callback) {
    var self = this;

    if (arguments.length === 2) {
        // if only two arguments were supplied
        if (Object.prototype.toString.call(params) === '[object Function]') {
            callback = params;
            params = null;
        }
    }

    var dfd = _jquery2.default.Deferred();

    var modalConfigToShow = findByName(self.modalConfigs, name);

    if (!modalConfigToShow) {
        throw new Error('Modaler.show - Unregistered modal: ' + name);
    }

    var shownDeferred = _jquery2.default.Deferred();

    var modal = {
        settings: {
            close: function close(data, options) {
                modal.data = data;
                return hideModal(self, options);
            },
            shown: _knockout2.default.observable(false),
            params: params,
            title: modalConfigToShow.title
        },
        deferred: dfd,
        shownDeferred: shownDeferred,
        callback: callback,
        componentName: modalConfigToShow.componentName,
        //TODO: On pourrait permettre d'overrider les settings de base (du registerModal) pour chaque affichage en passant backdrop & keyboard en plus a Modaler.prototype.show
        backdrop: modalConfigToShow.backdrop,
        keyboard: modalConfigToShow.keyboard
    };

    if (self.isModalOpening() || self.isModalHiding()) {
        self.showModalQueue.push(modal);

        if (self.isModalHiding()) {
            var sub = self.isModalHiding.subscribe(function () {
                sub.dispose();

                var lastModal = self.showModalQueue.pop();
                self.showModalQueue = [];

                if (lastModal) {
                    show(self, lastModal).always(lastModal.callback);
                }
            });
        }
    } else if (self.currentModal()) {
        self.hideCurrentModal({
            noTransition: true
        }).then(function () {
            show(self, modal).always(modal.callback);
        });
    } else {
        isModalerReady(self).then(function () {
            show(self, modal).always(modal.callback);
        });
    }

    return dfd.promise();
};

Modaler.prototype.hideCurrentModal = function (options) {
    var self = this;
    var dfd = _jquery2.default.Deferred();

    try {
        if (self.isModalOpening()) {
            var sub = self.isModalOpening.subscribe(function () {
                sub.dispose();
                registerOrUnregisterHideModalKeyboardShortcut(self, false);
                hideCurrentModal(self, options, dfd);
            });
        } else {
            hideCurrentModal(self, options, dfd);
        }
    } catch (err) {
        dfd.reject(err);
    }

    return dfd.promise();
};

function hideCurrentModal(self, options, dfd) {
    var currentModal = self.currentModal();

    if (currentModal) {
        self.isModalHiding(true);

        currentModal.settings.close(null, options).then(function () {
            self.isModalHiding(false);
            dfd.resolve();
        });
    } else {
        dfd.resolve();
    }
}

Modaler.prototype.registerModal = function (name, modalConfig) {
    if (!name) {
        throw new Error('Modaler.registerModal - Argument missing exception: name');
    }

    modalConfig = modalConfig || {};
    modalConfig.name = name;

    var componentConfig = buildComponentConfigFromModalConfig(name, modalConfig);
    _knockout2.default.components.register(componentConfig.name, componentConfig);

    var finalModalConfig = applyModalConventions(name, modalConfig, componentConfig);

    this.modalConfigs.push(finalModalConfig);
};

Modaler.prototype.hideCurrentModalHandler = function (e) {
    var self = this;
    switch (e.keyCode) {
        case KEYCODE_ESC:
            self.hideCurrentModal();
            break;
    }
};

function showModalQueue(self) {
    if (self.showModalQueue.length) {
        self.hideCurrentModal().then(function () {
            var lastModal = self.showModalQueue.pop();
            self.showModalQueue = [];
            if (lastModal) {
                show(self, lastModal).always(lastModal.callback);
            }
        });
    }
}

function registerOrUnregisterHideModalKeyboardShortcut(self, isModalOpen) {
    if (self.currentModal() === null) {
        return;
    }

    if (isModalOpen && !self.currentModal().settings.params || isModalOpen && self.currentModal().settings.params && !self.currentModal().settings.params.disableKeyEvents) {
        self.$document.on('keydown', _jquery2.default.proxy(self.hideCurrentModalHandler, self));
    } else {
        self.$document.off('keydown', _jquery2.default.proxy(self.hideCurrentModalHandler, self));
    }
}

function isModalerReady(self) {
    return _kocoKnockoutUtilities2.default.koBindingDone(self.$modalElement, null, null, true);
}

function buildComponentConfigFromModalConfig(name, modalConfig) {
    return {
        name: name + '-modal',
        htmlOnly: modalConfig.htmlOnly,
        basePath: modalConfig.basePath,
        isBower: modalConfig.isBower,
        type: 'modal'
    };
}

function applyModalConventions(name, modalConfig, componentConfig) {
    var finalModalConfig = _jquery2.default.extend({}, modalConfig);

    finalModalConfig.componentName = componentConfig.name;

    return finalModalConfig;
}

function show(self, modal) {
    self.isModalOpening(true);

    var dfd = _jquery2.default.Deferred();

    try {
        self.currentModal(modal);

        self.$modalElement.removeData('bs.modal').modal({
            backdrop: modal.backdrop,
            keyboard: modal.keyboard,
            show: true
        });

        self.$modalElement.one('hidden.bs.modal', function () {
            self.currentModal(null);
            modal.deferred.resolve(modal.data);
        });

        if (!self.$modalElement.hasClass('in')) {
            self.$modalElement.modal('show');

            // We use a timeout because the shown.bs.modal event is not reliable
            // For example, if the page is in a background tab, it won't be triggered
            setTimeout(function () {
                resolveShown(self, dfd, modal);
            }, TRANSITION_DURATION);
        } else {
            resolveShown(self, dfd, modal);
        }
    } catch (err) {
        self.isModalOpening(false);
        modal.deferred.reject(err);
        dfd.reject(err);
    }

    return dfd.promise();
}

function resolveShown(self, dfd, modal) {
    self.isModalOpening(false);
    modal.settings.shown(true);
    modal.shownDeferred.resolve();

    self.focused(modal.settings.params && !modal.settings.params.preventFocus);

    dfd.resolve(self.$modalElement);

    showModalQueue(self);
}

function hideModal(self, options) {
    var dfd = _jquery2.default.Deferred();

    try {
        if (self.$modalElement.hasClass('in')) {
            self.$modalElement.one('hidden.bs.modal', function () {
                dfd.resolve(self.$modalElement);
            }).modal('hide');
        } else {
            dfd.resolve(self.$modalElement);
        }
    } catch (err) {
        dfd.reject(err);
    }

    return dfd.promise();
}

function getModalElement() {
    var $modalerElement = (0, _jquery2.default)('modaler');

    if ($modalerElement.length < 1) {
        throw new Error('Modaler.show - The modaler component is missing in the page.');
    }

    if ($modalerElement.length > 1) {
        throw new Error('Modaler.show - There must be only one instance of the modaler component in the page.');
    }

    return $modalerElement;
}

function findByName(collection, name) {
    var result = _lodash2.default.find(collection, function (obj) {
        return obj.name === name;
    });

    return result || null;
}

exports.default = new Modaler();