define(['modaler', 'text!./modaler.html'],
    function(modaler, template) {

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