App.UserCreateController = Ember.Controller.extend({
    create: function() {
        console.log("creating account");
        var user = new nitrogen.User({ name: $('#name').val(),
                                      email: $('#email').val(),
                                      password: $('#password').val(),
                                      local_id: 'current' });

        App.service.create(user, App.sessionHandler);
    }
});