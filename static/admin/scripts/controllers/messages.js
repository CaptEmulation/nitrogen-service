App.MessagesController = Ember.ArrayController.extend({
 	onMessage: function(message) {
        this.unshiftObject(message);
    },

    claim: function() {
        var principalId = $('principalId').val();

        console.log("claiming device: " + principalId);

        var claim = new nitrogen.Message({
            to: 'system',
            message_type: 'claim',
            body: {
                principal: principalId
            },
            expires: 'never'
        });

        response.save(App.session, function(err, messages) {
            if (err) console.log(err);
        });
    }
});