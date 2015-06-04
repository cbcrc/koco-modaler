define(['jquery', 'bootstrap', 'knockout', 'lodash', 'knockout-utilities'],
    function($, bootstrap, ko, _, koUtilities) {
        'use strict';

        var KEYCODE_ESC = 27;

        var TRANSITION_DURATION = 300;
        if ($.fn.modal.Constructor && $.fn.modal.Constructor.TRANSITION_DURATION) {
            TRANSITION_DURATION = $.fn.modal.Constructor.TRANSITION_DURATION;
        }

        function Modaler() {
            var self = this;

            self.$document = $(document);

            koUtilities.registerComponent('modaler', {
                basePath: 'bower_components/koco-modaler/src'
            });

            koUtilities.registerComponent('modal', {
                htmlOnly: true,
                basePath: 'bower_components/koco-modaler/src'
            });

            self.modalConfigs = [];
            self.currentModal = ko.observable(null);
            self.showModalQueue = [];

            self.isModalOpen = ko.computed(function() {
                return !!self.currentModal();
            });

            self.focused = ko.observable(false);


            self.isModalOpen.subscribe(function(isModalOpen) {
                registerOrUnregisterHideModalKeyboardShortcut(self, isModalOpen);
            });

            self.currentModalTitle = ko.computed(function() {
                var currentModal = self.currentModal();

                if (currentModal) {
                    return currentModal.title;
                }

                return '';
            });

            self.isModalOpening = ko.observable(false);
            self.isModalHiding = ko.observable(false);
        }

        //TODO: Passer $modalElement en argument au lieu
        Modaler.prototype.init = function( /*config*/ ) {
            var self = this;

            self.$modalElement = getModalElement();

            self.$modalElement.modal({
                show: false
            });
        };

        Modaler.prototype.show = function(name, params, callback) {
            var self = this;

            if (arguments.length === 2) { // if only two arguments were supplied
                if (Object.prototype.toString.call(params) === '[object Function]') {
                    callback = params;
                    params = null;
                }
            }

            var dfd = $.Deferred();

            var modalConfigToShow = findByName(self.modalConfigs, name);

            if (!modalConfigToShow) {
                throw new Error('Modaler.show - Unregistered modal: ' + name);
            }

            var shownDeferred = $.Deferred();

            var modal = {
                settings: {
                    close: function(data, options) {
                        modal.data = data;
                        return hideModal(self, options);
                    },
                    shown: ko.observable(false),
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
                    var sub = self.isModalHiding.subscribe(function() {
                        sub.dispose();

                        var lastModal = self.showModalQueue.pop();
                        self.showModalQueue = [];

                        if (lastModal) {
                            show(self, lastModal).always(lastModal.callback);
                        }
                    });
                }
            } else if (self.currentModal()) {
                console.log('ici...');
                self.hideCurrentModal({
                    noTransition: true
                }).then(function() {
                    show(self, modal).always(modal.callback);
                });
            } else {
                isModalerReady(self).then(function() {
                    show(self, modal).always(modal.callback);
                });
            }

            return dfd.promise();
        };

        Modaler.prototype.hideCurrentModal = function(options) {
            var self = this;
            var dfd = $.Deferred();

            try {
                if (self.isModalOpening()) {
                    var sub = self.isModalOpening.subscribe(function() {
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

                currentModal.settings.close(null, options).then(function() {
                    self.isModalHiding(false);
                    dfd.resolve();
                });
            } else {
                dfd.resolve();
            }
        }

        Modaler.prototype.registerModal = function(name, modalConfig) {
            if (!name) {
                throw new Error('Modaler.registerModal - Argument missing exception: name');
            }

            modalConfig = modalConfig || {};
            modalConfig.name = name;

            var componentConfig = buildComponentConfigFromModalConfig(name, modalConfig);
            koUtilities.registerComponent(componentConfig.name, componentConfig);

            var finalModalConfig = applyModalConventions(name, modalConfig, componentConfig);

            this.modalConfigs.push(finalModalConfig);
        };

        Modaler.prototype.hideCurrentModalHandler = function(e) {
            var self = this;
            switch (e.keyCode) {
                case KEYCODE_ESC:
                    self.hideCurrentModal();
                    break;
            }
        };

        function showModalQueue(self) {
            if (self.showModalQueue.length) {
                self.hideCurrentModal().then(function() {
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

            if ((isModalOpen && !self.currentModal().settings.params) || (isModalOpen && (self.currentModal().settings.params && !self.currentModal().settings.params.disableKeyEvents))) {
                self.$document.on('keydown', $.proxy(self.hideCurrentModalHandler, self));
            } else {
                self.$document.off('keydown', $.proxy(self.hideCurrentModalHandler, self));
            }
        }

        function isModalerReady(self) {
            return koUtilities.koBindingDone(self.$modalElement, null, null, true);
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
            var finalModalConfig = $.extend({}, modalConfig);

            finalModalConfig.componentName = componentConfig.name;

            return finalModalConfig;
        }

        function show(self, modal) {
            self.isModalOpening(true);

            var dfd = $.Deferred();

            try {
                self.currentModal(modal);

                self.$modalElement.removeData('bs.modal').modal({
                    backdrop: modal.backdrop,
                    keyboard: modal.keyboard,
                    show: true
                });

                self.$modalElement.on('hidden.bs.modal', function() {
                    modal.deferred.resolve(modal.data);
                    self.currentModal(null);
                });

                if (!self.$modalElement.hasClass('in')) {
                    self.$modalElement.modal('show');

                    // We use a timeout because the shown.bs.modal event is not reliable
                    // For example, if the page is in a background tab, it won't be triggered
                    setTimeout(function() {
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
            var dfd = $.Deferred();

            try {
                if (self.$modalElement.hasClass('in')) {
                    self.$modalElement.one('hidden.bs.modal', function() {
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
            var $modalerElement = $('modaler');

            if ($modalerElement.length < 1) {
                throw new Error('Modaler.show - The modaler component is missing in the page.');
            }

            if ($modalerElement.length > 1) {
                throw new Error('Modaler.show - There must be only one instance of the modaler component in the page.');
            }

            return $modalerElement;
        }

        function findByName(collection, name) {
            var result = _.find(collection, function(obj) {
                return obj.name === name;
            });

            return result || null;
        }

        return new Modaler();
    });
