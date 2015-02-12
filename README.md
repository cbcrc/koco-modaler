# Knockout Modaler

Knockout Modaler is a knockout component used to display modal screen. It is an opinionated component based on the [Koco generator](https://github.com/Allov/generator-koco).

## Table of contents

- [Installation](#installation)
- [Usage](#usage)
- [Registering a modal](#registering-a-modal)
- [Creating a modal component](#creating-a-modal-component)
    - [JavaScript UI handler](#javascript-ui-handler)
    - [HTML presentation](#html-presentation)
- [Using a modal](#using-a-modal)
    - [Displaying a modal](#displaying-a-modal)
    - [Closing and returning data from a modal](#closing-and-returning-data-from-a-modal)

## Installation

    bower install knockout-modaler

## Usage

In your startup file, we need to do a number of things in order to fully initialize the router:

### startup.js

    define(['knockout', 'modaler'],
        function(ko, modaler) {
            'use strict';

            // First: registering a modal.
            modaler.registerModal('modal_name', {
                    title: 'modal_title'
            });

            // Second: bind the Knockout ViewModel with the modaler object.
            ko.applyBindings({
                    modaler: modaler
                    // other objects come here
            });

            // Third: initialize the modaler.
            modaler.init();
        });

### index.html

    <!DOCTYPE html>
    <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Test</title>
        </head>
        <body>
            <modaler class="modal fade" data-bind="visible: modaler.isModalOpen" params="{ title: modaler.currentModalTitle }"></modaler>
        </body>
    </html>

## Registering a modal

To register a modal, you have to use the `registerModal` function:

    modaler.registerModal(name, options)

### `name` parameter

The name of the knockout component being added. `-modal` will be appended automatically at the end.

### `options` parameter

The options to be used when creating the modal.

    {
        title: string       // defines the title of the modal when displaying.
        isBower: boolean    // defines if the component comes from bower, a default bower path will be used.
        basePath: string    // the base path to be use to find the component. It has to be the root of the default files (see below).
        htmlOnly: boolean   // when creating a modal, it is possible that there would be no JavaScript linked to this dialog, it will assume so and load the html file using the naming convention (see below).
    }

## Creating a modal component

The creation of a modal is based on the knockout component system.

### JavaScript UI handler

By convention, the name of the file has to be `[name]-modal-ui.js`, `[name]` being the name of your new modal. This file has to return a Knockout component structure.

    define(["text!./test-modal.html", "knockout"], // beware of the first parameter where you have to define the html file to be used.
        function(template, ko) {
            'use strict';

            var ViewModel = function(params, componentInfo) {
                var self = this;

                self.close = function() {
                    params.close();
                };

                return self;
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


### HTML presentation

When using a JavaScript UI handler, the name of this file has to be defined by you. However, if using the htmlOnly option, the component will be loading [name]-modal.html by convention.

     <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <h4 class="modal-title">Modal title</h4>
          </div>
          <div class="modal-body">
            <p>One fine body&hellip;</p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
          </div>
        </div>
      </div><

## Using a modal

Now that you created a modal, you may want to display it and possibly get data from it.

### Displaying a modal

To show a modal, you have to use the `showModal()` function.

    modaler.showModal(name)

This function returns a `jQuery promise` and will resolve itself when the modal is closed.

### Closing and returning data from a dialog

Upon displaying a modal, it will present itself in fullscreen and blocking interface. The close button and any data to be transfered to the caller have to be handled by the callee.

#### Returing data

The [JavaScript UI handler](#javascript-ui-handler) will receive a `close` function in its `params` parameter.

    close(data)

The `data` parameter is an object and will be passed as-is to the caller.

Since `showModal` returns a promise, you have to use the `then` function to claim the returned data.

    modaler.showModal('name').then(function(data) {
            console.log(data);
        });

#### Closing

To close a modal, you can:

- call `close()` without any parameter from inside the [JavaScript UI Handler](#javascript-ui-handler)
- call `modaler.hideCurrentModal()` from anywhere which will cause the currently displayed modal to close whitout sending any data.

*Remark*: It is impossible to have two modals displayed at the same time, modaler will close the current modal when `showModal()` is called.