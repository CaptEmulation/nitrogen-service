App.ApplicationController = Ember.Controller.extend({
    signout: function() {
        App.get('session').clearCredentials();
        App.resetSession();
    }
});