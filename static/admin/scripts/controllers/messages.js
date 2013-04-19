App.MessagesController = Ember.ArrayController.extend({
 	onMessage: function(message) {
        this.unshiftObject(message);
    }
});