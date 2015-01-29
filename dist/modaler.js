define(['jquery', 'bootstrap', 'knockout', 'lodash'],
    function($, bootstrap, ko, _) {
        'use strict';
        
        function Framework() {
            var self = this;

            self.$document = $(document);

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


            //TODO: ?
            //Permet d'afficher un dialog si ?dialog=dialog_name
            // self.currentRoute.subscribe(function(route) {
            //     if (route.dialog) {
            //         self.showDialog(route.dialog);
            //     }
            // });

            configureRouting(self);
        }

        Framework.prototype.init = function( /*config*/ ) {
            var self = this;

            self.$modalElement = getModalElement();

            self.$modalElement.modal({
                show: false
            });

            self.registerComponent('modal', {
                basePath: 'bower_components/rc.framework.js/dist/components/'
            });
        };

        Framework.prototype.showModal = function(name, params) {
            var deferred = new $.Deferred();
            var self = this;

            var modalConfigToShow = findByName(self.modalConfigs, name);

            if (!modalConfigToShow) {
                throw new Error('Framework.showModal - Unregistered modal: ' + name);
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
                //TODO: On pourrait permettre d'overrider les settings de base (du registerModal) pour chaque affichage en passant backdrop & keyboard en plus a Framework.prototype.showModal
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

        Framework.prototype.hideCurrentModal = function() {
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

        Framework.prototype.registerModal = function(name, modalConfig) {
            if (!modalConfig.name) {
                throw new Error('Framework.registerModal - Argument missing exception: name');
            }

            var componentConfig = buildComponentConfigFromModalConfig(modalConfig);
            this.registerComponent(componentConfig.name, componentConfig);

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
            var $modalElement = $('modal');

            if ($modalElement.length < 1) {
                throw new Error('Framework.showModal - The modal component is missing in the page.');
            }

            if ($modalElement.length > 1) {
                throw new Error('Framework.showModal - There must be only one instance of the modal component in the page.');
            }

            return $modalElement;
        }

        function findByName(collection, name) {
            var result = _.find(collection, function(obj) {
                return obj.name === name;
            });

            return result || null;
        }

        return new Framework();
    });
