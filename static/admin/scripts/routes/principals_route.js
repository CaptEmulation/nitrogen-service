App.PrincipalsRoute = Ember.Route.extend({

    model: function(params) {
        return App.Principal.find({ principal_type: params.principal_type });
    }

});