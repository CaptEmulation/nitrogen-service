App.Principal = Ember.Object.extend({
    lastConnectionString: function() {
        var date = new Date(Date.parse(this.get('last_connection')));
        return date.toLocaleString();
    }.property('last_connection')
});

App.Principal.reopenClass({
    find: function(query) {
        return App.findWithAdapter(query, nitrogen.Principal, App.Principal);
    }
});
