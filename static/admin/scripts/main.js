App = Ember.Application.create({
    rootElement: window.TESTING ? '#mocha' : '#app',
    LOG_TRANSITIONS: true
});

// We need to delay routing until we have a session setup (or fail).
App.deferReadiness();

// We try to find the headwaiter at the same host, port, and protocol this was served from by default.

App.config = {
    host: "192.168.1.14",
    http_port: 3030,
    protocol: "http"
};

App.config.store = new nitrogen.HTML5Store(App.config);
App.service = new nitrogen.Service(App.config);

// define function that we can use to jumpstart a user session.

App.resetSession = function(err) {
    if (App.get('session')) {
        App.get('session').close();
    }

    if (err === 400 && window.location.hash == "#/user/create") err = "That email already has an account.  Please log in with your credentials to continue.";
    if (err === 401) err = "Your username or password were not correct or your session has expired.";

    App.set('flash', err);
    App.set('session', null);
    App.set('user', null);

    App.advanceReadiness();

    // TODO: what's the right way to do this outside of an ember.js controller?
    window.location = "#/user/login";
};

App.sessionHandler = function(err, session, user) {
    if (err || !session || !user) return App.resetSession(err);

    App.set('err', null);

    // TODO: what's the right way to transition outside of a router in ember.js?
    if (window.location.hash == "#/user/login" || window.location.hash == "#/user/create") {
        window.location = "#/messages";
    }

    App.advanceReadiness();

    // save away the session for use in the ember application.
    App.set('session', session);
    App.set('user', App.Principal.create(user));

    session.onAuthFailure(App.resetSession);

    session.onMessage(function(nitrogenMessage) {
        console.log("message received: " + JSON.stringify(nitrogenMessage));
        var message = App.Message.create(nitrogenMessage);

        Ember.Instrumentation.instrument('onMessage', message);
    });
};

// attempt to start session from the cached access token in local storage.
// if the user doesn't exist or the access token is expired -> direct to login.

var user = new nitrogen.User({ local_id: "current" });
App.service.resume(user, App.sessionHandler);