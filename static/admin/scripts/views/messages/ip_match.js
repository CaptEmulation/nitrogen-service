App.IpMatchView = Em.View.extend({
    templateName: 'messages/ip_match',

    sendResponse: function(responseType, match) {
        var response = new nitrogen.Message({
            to: 'system',
            message_type: responseType,
            response_to: match.id,
            body: {
                principal: match.body.principal
            },
            expires: 'never'
        });

        response.save(App.session, function(err, messages) {
            if (err) console.log(err);
        });
    },

    claim: function(match) {
        this.sendResponse('claim', match);
    },

    reject: function(match) {
        this.sendResponse('reject', match);
    }
});
