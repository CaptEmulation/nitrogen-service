var assert = require('assert')
  , config = require('../../config')
  , fixtures = require('../fixtures')
  , log = require('../../log')
  , models = require('../../models')
  , services = require('../../services');

describe('principals service', function() {
    var passwordFixture = "sEcReT44";

    it('can create and validate a user', function(done) {
        var user = new models.Principal({ type: "user",
                                          email: "user@gmail.com",
                                          public: false,
                                          password: passwordFixture });

        services.principals.create(user, function(err, user) {
            assert.ifError(err);
            assert.notEqual(user.id, undefined);
            assert.notEqual(user.visible_to, undefined);
            assert.notEqual(user.visible_to.length, 0);
            assert.notEqual(user.password_hash, undefined);
            assert.notEqual(user.password_hash, passwordFixture);
            assert.equal(user.email, "user@gmail.com");

            var principalJson = user.toJSON();
            assert.equal(principalJson.password_hash, undefined);
            assert.equal(principalJson.salt, undefined);

            services.principals.verifyPassword(passwordFixture, user, function(err) {
                assert.ifError(err);

                services.principals.verifyPassword("NOTCORRECT", user, function(err) {
                     assert.notEqual(err, null);
                     done();
                });
            });
        });
    });

    it('can create and validate a device', function(done) {
        var device = new models.Principal({ type: "device" });
        services.principals.create(device, function(err, device) {
            assert.ifError(err);
            assert.notEqual(device.id, undefined);
            assert.notEqual(device.secret_hash, undefined);

            services.principals.verifySecret(device.secret, device, function(err) {
                assert.ifError(err);
                services.principals.verifySecret("NOTCORRECT", device, function(err) {
                    assert.notEqual(err, null);
                    done();
                });
            });
        });
    });

    it('can generate a claim code', function(done) {
        var code = services.principals.generateClaimCode();
        assert.notEqual(code, undefined);
        assert.equal(code.length, config.claim_code_length + 1);
 
        done();
    });

    it('can authenticate a device', function(done) {

        var request = { id: fixtures.models.principals.device.id,
                        secret: fixtures.models.principals.device.secret };

        services.principals.authenticate(request, function(err, principal, accessToken) {
            assert.ifError(err);
            assert.notEqual(principal, undefined);
            assert.notEqual(accessToken, undefined);

            done();
        });
    });

    it('service can update name', function(done) {
        fixtures.models.principals.device.name = 'my camera';
        services.principals.update(services.principals.servicePrincipal, fixtures.models.principals.device.id, { name: "my camera"}, function(err, principal) {
            assert.ifError(err);
            assert.equal(principal.name, 'my camera');

            done();
        });
    });

    it('service can update visible_to', function(done) {
        fixtures.models.principals.device.name = 'my camera';

        fixtures.models.principals.device.visible_to.push("52747742e2948d8e7f000001");

        services.principals.update(services.principals.servicePrincipal, fixtures.models.principals.device.id, 
            { visible_to: fixtures.models.principals.device.visible_to }, function(err, updatedPrincipal) {
            assert.ifError(err);

            var foundPrincipal = false;
            updatedPrincipal.visible_to.forEach(function(principalId) {
                if (principalId.toString() === "52747742e2948d8e7f000001")
                    foundPrincipal = true;
            });

            assert(foundPrincipal);
            done();
        });
    });

    it("a user principal can update a principal's name", function(done) {
        services.principals.update(fixtures.models.principals.user, fixtures.models.principals.user.id, { name: "Joe User" }, function(err, principal) {
            assert.ifError(err);
            assert.equal(principal.name, "Joe User");
            done();
        });
    });

    it('should reject creating a user without an email', function(done) {
        var user = new models.Principal({ type: 'user',
            password: fixtures.models.principals.user.password });

        services.principals.create(user, function(err, user) {
            assert.equal(!!err, true);
            done();
        });
    });

    it('should reject creating a user without a password', function(done) {
        var user = new models.Principal({ type: 'user',
                                          email: 'newuser@gmail.com' });

        services.principals.create(user, function(err, user) {
            assert.equal(!!err, true);
            done();
        });
    });

    it('should reject user deleting the service principal', function(done) {
        services.principals.removeById(fixtures.models.principals.user, services.principals.servicePrincipal.id, function(err) {
            assert.equal(!!err, true);
            done();
        });
    });

    it('should allow user deleting a device it owns', function(done) {
        services.principals.removeById(fixtures.models.principals.user, fixtures.models.principals.device.id, function(err) {
            assert.ifError(err);
            done();
        });
    });

    it('should reject creating a if user that already exists', function(done) {
        var user = new models.Principal({ type: 'user',
                                          email: fixtures.models.principals.user.email,
                                          password: fixtures.models.principals.user.password });

        services.principals.create(user, function(err, user) {
            assert.equal(!err, false);
            done();
        });
    });

    it('can create a user and change its password.', function(done) {
        var user = new models.Principal({ 
            type: "user",
            email: "changePassword@gmail.com",
            public: false,
            password: "firstPassword" 
        });

        services.principals.create(user, function(err, user) {
            assert.ifError(err);

            var originalPasswordHash = user.password_hash;

            services.accessTokens.findOrCreateToken(user, function(err, accessToken) {
                assert.ifError(err);
                assert.notEqual(accessToken, undefined);

                services.accessTokens.findByPrincipal(user, function(err, accessTokens) {
                    assert.ifError(err);
                    assert(accessTokens.length > 0);

                    services.principals.changePassword(user, "anotherPassword", function(err, principal) {
                        assert.ifError(err);
                        assert.notEqual(principal.password_hash, originalPasswordHash);
                        
                        services.accessTokens.findByPrincipal(user, function(err, accessTokens) {
                            assert.ifError(err);

                            assert.equal(accessTokens.length, 0);
                            done();
                        });
                    });
                });
            });
        });
    });
});
