var assert = require('assert')
  , utils = require('../../utils');

describe('utils', function() {

    it('can translate sensed date strings into date objects', function(done) {
        var testObject = {
            shouldBeString: "test",
            shouldBeDate: "2013-05-06T18:27:33.053Z"
        };

        var translatedObject = utils.translateDatesToNative(testObject);

        assert.equal(typeof translatedObject.shouldBeString, "string");
        assert.equal(typeof translatedObject.shouldBeDate, "object");

        var testObjectWithHierarchy = {
            hasADate: {
                justAString: "test",
                shouldBeDate: "2013-05-06T18:27:33.053Z"
            }
        };

        var translatedObject = utils.translateDatesToNative(testObjectWithHierarchy);

        assert.equal(typeof translatedObject.hasADate.justAString, "string");
        assert.equal(typeof translatedObject.hasADate.shouldBeDate, "object");

        done();
    });

});
