define(['jquery', 'bootstrap', 'knockout', 'lodash', 'knockout-utilities'],
    function($, bootstrap, ko, _, koUtilities) {
        'use strict';

        function Modaler() {
            var self = this;

            self.$document = $(document);

            koUtilities.registerComponent('modaler', {
                isBower: true
            });

            self.modalConfigs = [];
            self.currentModal = ko.observable(null);

            self.isModalOpen = ko.computed(function() {
                return !!self.currentModal();
            });

            self.currentModalTitle = ko.computed(function() {
                var currentModal = self.currentModal();

                if (currentModal) {
                    return currentModal.title;
                }

                return '';
            });
        }

        //TODO: Passer $modalElement en argument au lieu
        Modaler.prototype.init = function( /*config*/ ) {
            var self = this;

            self.$modalElement = getModalElement();

            self.$modalElement.modal({
                show: false
            });
        };

        Modaler.prototype.showModal = function(name, params) {
            var deferred = new $.Deferred();
            var self = this;

            var modalConfigToShow = findByName(self.modalConfigs, name);

            if (!modalConfigToShow) {
                throw new Error('Modaler.showModal - Unregistered modal: ' + name);
            }

            var modal = {
                settings: {
                    close: function(data) {
                        modal.data = data;
                        return hideModal(self);
                    },
                    params: params,
                    title: modalConfigToShow.title
                },
                componentName: modalConfigToShow.componentName,
                //TODO: On pourrait permettre d'overrider les settings de base (du registerModal) pour chaque affichage en passant backdrop & keyboard en plus a Modaler.prototype.showModal
                backdrop: modalConfigToShow.backdrop,
                keyboard: modalConfigToShow.keyboard
            };

            var currentModal = self.currentModal();

            if (currentModal) {
                currentModal.settings.close().then(function() {
                    showModal(self, deferred, modal);
                });
            } else {
                showModal(self, deferred, modal);
            }

            return deferred.promise();
        };

        Modaler.prototype.hideCurrentModal = function() {
            var deferred = new $.Deferred();

            var currentModal = this.currentModal();

            if (currentModal) {
                currentModal.settings.close().then(function() {
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }

            return deferred.promise();
        };

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

            if (!finalModalConfig.title) {
                finalModalConfig.title = name;
            }

            finalModalConfig.componentName = componentConfig.name;

            return finalModalConfig;
        }

        function showModal(self, deferred, modal) {
            self.$modalElement.on('hidden.bs.modal', function( /*e*/ ) {
                self.currentModal(null);
                deferred.resolve(modal.data);
            });

            self.currentModal(modal);

            self.$modalElement.removeData('bs.modal').modal({
                backdrop: modal.backdrop,
                keyboard: modal.keyboard,
                show: true
            });

            var def = new $.Deferred();

            if (!self.$modalElement.hasClass('in')) {
                self.$modalElement.modal('show')
                    .on('shown.bs.modal', function( /*e*/ ) {
                        def.resolve(self.$modalElement);
                    });
            } else {
                def.resolve(self.$modalElement);
            }

            return def.promise();
        }

        function hideModal(self) {
            var deferred = new $.Deferred();

            // self.$modalElement.modal({
            //     show: false
            // });

            if (self.$modalElement.hasClass('in')) {
                self.$modalElement.modal('hide')
                    .on('hidden.bs.modal', function( /*e*/ ) {
                        deferred.resolve(self.$modalElement);
                    });
            } else {
                deferred.resolve(self.$modalElement);
            }

            return deferred.promise();
        }

        function getModalElement() {
            var $modalerElement = $('modaler');

            if ($modalerElement.length < 1) {
                throw new Error('Modaler.showModal - The modaler component is missing in the page.');
            }

            if ($modalerElement.length > 1) {
                throw new Error('Modaler.showModal - There must be only one instance of the modaler component in the page.');
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
