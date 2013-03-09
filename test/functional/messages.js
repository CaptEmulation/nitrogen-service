process.env.NODE_ENV = 'test';

var app = require('../../server'),
	assert = require('assert'),
	config = require('../../config'),
	faye = require('faye'),
    mongoose = require('mongoose'),
    request = require('request');

describe('messages endpoint', function() {
	it('should return all messages json', function(done) {
	    request(config.base_url + '/messages', function(err,resp,body) {
	      assert.equal(resp.statusCode, 200);
	      done();
	    });
	});

	it('should create and fetch a message', function(done) {
		var notification_passed = false,
			get_passed = false,
			started_post = false;

		var client = new faye.Client(config.realtime_url);
        console.log("messages functional test: created client: " + config.realtime_url);

		client.subscribe('/messages', function(message_json) {
            console.log("messages functional test: got subscription message");
            var message = JSON.parse(message_json);
			assert.equal(message.body.reading, 5.1);
			notification_passed = true;
		    if (notification_passed && get_passed) {
                client.unsubscribe('/messages');
                done();
		    }
		});

        console.log("messages functional test: created subscription");

        global.bayeux.bind('subscribe', function(clientId) {
            console.log("messages functional test: subscription is bound, posting message");
			if (started_post) return;
			started_post = true;

			request.post(config.base_url + '/messages',
				{ json: [{ from: new mongoose.Types.ObjectId(),
                           message_type: "custom",
                           body: { reading: 5.1 } }] }, function(post_err, post_resp, post_body) {
                  console.log("messages functional test: message posted, fetching message for confirmation.");
				  assert.equal(post_err, null);
			      assert.equal(post_resp.statusCode, 200);

			      var message_id = null;
                  post_body.messages.forEach(function(message) {
				      assert.equal(message.body.reading, 5.1);
				      message_id = message.id;
                  });

                  assert.notEqual(message_id, null);

			      request({ url: config.base_url + '/messages/' + message_id, json: true},
					function(get_err, get_resp, get_body) {
                        console.log("messages functional test: message fetched.");

		                assert.equal(get_err, null);
		                assert.equal(get_resp.statusCode, 200);

		                assert.equal(get_body.message.body.reading, 5.1);
		                assert.notEqual(get_body.message.created_at, 5.1);

		                get_passed = true;
		                if (notification_passed && get_passed) {
							client.unsubscribe('/messages');
							done();
		                }
	              });
		    });
    	});
	});

});