import $ from 'jquery';
import bootstrap from 'bootstrap';
import ko from 'knockout';
import _ from 'lodash';
import koUtilities from 'koco-knockout-utilities';

var KEYCODE_ESC = 27;

var TRANSITION_DURATION = 300;
if ($.fn.modal.Constructor && $.fn.modal.Constructor.TRANSITION_DURATION) {
  TRANSITION_DURATION = $.fn.modal.Constructor.TRANSITION_DURATION;
}

function Modaler() {
  var self = this;

  ko.components.register('modaler', {
    isNpm: true,
    isHtmlOnly: true
  });

  ko.components.register('modal', {
    basePath: 'bower_components/koco-modaler/src',
    isHtmlOnly: true
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

  return new Promise((resolve, reject) => {
    var modalConfigToShow = findByName(self.modalConfigs, name);

    if (!modalConfigToShow) {
      throw new Error('Modaler.show - Unregistered modal: ' + name);
    }

    let shownDeferred;
    new Promise((resolve2, reject2) => {
      shownDeferred = { resolve2, reject2 };
    });

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
      deferred: {
        resolve,
        reject
      },
      shownDeferred,
      callback,
      componentName: modalConfigToShow.componentName,
      // TODO: On pourrait permettre d'overrider les settings de base (du registerModal) pour chaque affichage en passant backdrop & keyboard en plus a Modaler.prototype.show
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
  });
};

Modaler.prototype.hideCurrentModal = function(options) {
  var self = this;

  return new Promise((resolve, reject) => {
    const dfd = { resolve, reject };
    if (self.isModalOpening()) {
      var sub = self.isModalOpening.subscribe(function() {
        sub.dispose();
        registerOrUnregisterHideModalKeyboardShortcut(self, false);
        hideCurrentModal(self, options, dfd);
      });
    } else {
      hideCurrentModal(self, options, dfd);
    }
  });
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
  ko.components.register(componentConfig.name, componentConfig);

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
    $(document).on('keydown', $.proxy(self.hideCurrentModalHandler, self));
  } else {
    $(document).off('keydown', $.proxy(self.hideCurrentModalHandler, self));
  }
}

function isModalerReady(self) {
  return koUtilities.koBindingDone(self.$modalElement, null, null, true);
}

function buildComponentConfigFromModalConfig(name, modalConfig) {
  return {
    name: name + '-modal',
    isHtmlOnly: modalConfig.isHtmlOnly,
    basePath: modalConfig.basePath,
    isNpm: modalConfig.isNpm,
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

  var promise = new Promise((resolve, reject) => {
    self.currentModal(modal);

    self.$modalElement.removeData('bs.modal').modal({
      backdrop: modal.backdrop,
      keyboard: modal.keyboard,
      show: true
    });

    self.$modalElement.one('hidden.bs.modal', function() {
      self.currentModal(null);
      modal.deferred.resolve(modal.data);
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
  });

  promise.catch(ex) {
    self.isModalOpening(false);
    modal.deferred.reject(ex);
  }

  return promise;
}

function resolveShown(self, resolve, modal) {
  self.isModalOpening(false);
  modal.settings.shown(true);
  modal.shownDeferred.resolve();

  self.focused(modal.settings.params && !modal.settings.params.preventFocus);

  resolve(self.$modalElement);

  showModalQueue(self);
}

function hideModal(self, options) {
  return new Promise((resolve) => {
    if (self.$modalElement.hasClass('in')) {
      self.$modalElement.one('hidden.bs.modal', function() {
        resolve(self.$modalElement);
      }).modal('hide');
    } else {
      resolve(self.$modalElement);
    }
  });
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

export default new Modaler();
