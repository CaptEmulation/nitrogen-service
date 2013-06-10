//   SunriseSunset Class (2013-04-21)
//
// OVERVIEW
//
//   Implementation of http://williams.best.vwh.net/sunrise_sunset_algorithm.htm
//
// LICENSE
//
//   Copyright 2011-2013 Preston Hunt <me@prestonhunt.com>
//
//   Licensed under the Apache License, Version 2.0 (the "License");
//   you may not use this file except in compliance with the License.
//   You may obtain a copy of the License at
//
//       http://www.apache.org/licenses/LICENSE-2.0
//
//   Unless required by applicable law or agreed to in writing, software
//   distributed under the License is distributed on an "AS IS" BASIS,
//   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//   See the License for the specific language governing permissions and
//   limitations under the License.
//
// DESCRIPTION
//
//   Provides sunrise and sunset times for specified date and position.
//   All dates are UTC.  Year is 4-digit.  Month is 1-12.  Day is 1-31.
//   Longitude is positive for east, negative for west. Latitude is
//   positive for north, negative for south.
//
// SAMPLE USAGE
//
//   var tokyo = new SunriseSunset( 2011, 1, 19, 35+40/60, 139+45/60);
//   tokyo.sunriseUtcHours()      --> 21.8199 = 21:49 GMT
//   tokyo.sunsetUtcHours()       --> 7.9070  = 07:54 GMT
//   tokyo.sunriseLocalHours(9)   --> 6.8199  = 06:49 at GMT+9
//   tokyo.sunsetLocalHours(9)    --> 16.9070 = 16:54 at GMT+9
//   tokyo.isDaylight(1.5)        --> true
//
//   var losangeles = new SunriseSunset( 2011, 1, 19, 34.05, -118.233333333 );
//   etc.

var SunriseSunset = function( utcFullYear, utcMonth, utcDay, latitude, longitude ) {
    this.zenith = 90 + 50/60; //   offical      = 90 degrees 50'
    //   civil        = 96 degrees
    //   nautical     = 102 degrees
    //   astronomical = 108 degrees

    this.utcFullYear = utcFullYear;
    this.utcMonth = utcMonth;
    this.utcDay = utcDay;
    this.latitude = latitude;
    this.longitude = longitude;

    this.rising = true; // set to true for sunrise, false for sunset
    this.lngHour = this.longitude / 15;
};

SunriseSunset.prototype = {
    sin: function( deg ) { return Math.sin( deg * Math.PI / 180 ); },
    cos: function( deg ) { return Math.cos( deg * Math.PI / 180 ); },
    tan: function( deg ) { return Math.tan( deg * Math.PI / 180 ); },
    asin: function( x ) { return (180/Math.PI) * Math.asin(x); },
    acos: function( x ) { return (180/Math.PI) * Math.acos(x); },
    atan: function( x ) { return (180/Math.PI) * Math.atan(x); },

    getDOY: function() {
        var month = this.utcMonth,
            year = this.utcFullYear,
            day = this.utcDay;

        var N1 = Math.floor( 275 * month / 9 );
        var N2 = Math.floor( (month + 9) / 12 );
        var N3 = (1 + Math.floor((year - 4 * Math.floor(year / 4 ) + 2) / 3));
        var N = N1 - (N2 * N3) + day - 30;
        return N;
    },

    approximateTime: function() {
        var doy = this.getDOY();
        if ( this.rising ) {
            return doy + ((6 - this.lngHour) / 24);
        } else {
            return doy + ((18 - this.lngHour) / 24);
        }
    },

    meanAnomaly: function() {
        var t = this.approximateTime();
        return (0.9856 * t) - 3.289;
    },

    trueLongitude: function() {
        var M = this.meanAnomaly();
        var L = M + (1.916 * this.sin(M)) + (0.020 * this.sin(2 * M)) + 282.634;
        return L % 360;
    },

    rightAscension: function() {
        var L = this.trueLongitude();
        var RA = this.atan(0.91764 * this.tan(L));
        RA %= 360;

        var Lquadrant  = (Math.floor( L/90)) * 90;
        var RAquadrant = (Math.floor(RA/90)) * 90;
        RA = RA + (Lquadrant - RAquadrant);
        RA /= 15;

        return RA;
    },

    sinDec: function() {
        var L = this.trueLongitude(),
            sinDec = 0.39782 * this.sin(L);

        return sinDec;
    },

    cosDec: function() {
        return this.cos(this.asin(this.sinDec()));
    },

    localMeanTime: function() {
        var cosH = (this.cos(this.zenith) - (this.sinDec() * this.sin(this.latitude)))
            / (this.cosDec() * this.cos(this.latitude));

        if (cosH >  1) {
            return "the sun never rises on this location (on the specified date)";
        } else if (cosH < -1) {
            return "the sun never sets on this location (on the specified date)";
        } else {
            var H = this.rising ? 360 - this.acos(cosH) : this.acos(cosH);
            H /= 15;
            var RA = this.rightAscension();
            var t = this.approximateTime();
            var T = H + RA - (0.06571 * t) - 6.622;
            return T;
        }
    },

    hoursRange: function( h ) {
        return (h+24) % 24;
    },

    UTCTime: function() {
        var T = this.localMeanTime();
        var UT = T - this.lngHour;
        return this.hoursRange( UT );
        //if ( UT < 0 ) UT += 24;
        //return UT % 24;
    },

    sunriseUtcHours: function() {
        this.rising = true;
        return this.UTCTime();
    },

    sunsetUtcHours: function() {
        this.rising = false;
        return this.UTCTime();
    },

    sunriseLocalHours: function(gmt) {
        return this.hoursRange( gmt + this.sunriseUtcHours() );
    },

    sunsetLocalHours: function(gmt) {
        return this.hoursRange( gmt + this.sunsetUtcHours() );
    },

    // utcCurrentHours is the time that you would like to test for daylight, in hours, at UTC
    // For example, to test if it's daylight in Tokyo (GMT+9) at 10:30am, pass in
    // utcCurrentHours=1.5, which corresponds to 1:30am UTC.
    isDaylight: function( utcCurrentHours ) {
        var sunriseHours = this.sunriseUtcHours(),
            sunsetHours = this.sunsetUtcHours();

        if ( sunsetHours < sunriseHours ) {
            // Either the sunrise or sunset time is for tomorrow
            if ( utcCurrentHours > sunriseHours ) {
                return true;
            } else if ( utcCurrentHours < sunsetHours ) {
                return true;
            } else {
                return false;
            }
        }

        if ( utcCurrentHours >= sunriseHours ) {
            return utcCurrentHours < sunsetHours;
        }

        return false;
    }
};

function setupSnapshots() {
    if (!params || !params.camera_id) {
        return log.error('sunset agent: no camera target defined.');
    }

    var now = new Date();
    var midnightUTC = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + 1));
    var sunsetCalculator = new SunriseSunset(now.getYear(), now.getMonth(), now.getDate() + 1, 36.9742, -122.0297);
    var millisecondsFromMidnightToSunset = sunsetCalculator.sunsetUtcHours() * 3600 * 1000;
    var sunset = new Date(midnightUTC.getTime() + millisecondsFromMidnightToSunset);

    var message = new nitrogen.Message({
        to: params.camera_id,
        ts: sunset,
        type: 'cameraCommand',
        body: {
            command: 'snapshot'
        },
        tags: ['sunset']
    });

    log.info('sending sunset snapshot command for ' + sunset);

    message.save(session);

//    async.waterfall([
//        findLastLocation,
//        sendMessage
//    ]);
}

function findLastLocation(callback) {
    nitrogen.Message.find(session, { type: 'location', from: params.camera_id }, function(err, messages) {
        if (err) return callback(err);

        if (!messages) {
            messages = [
                new nitrogen.Message({
                    type: 'location',
                    from: params.camera_id,
                    body: {
                        latitude: 36.9742,
                        longitude: 122.0297
                    }
                })
            ];
        }

        callback(null, messages[0]);
    });
}

function sendMessage(location, callback) {
    var times = suncalc.getTimes(new Date(), location.body.latitude, location.body.longitude);
    var message = new nitrogen.Message({
        type: 'cameraControl',
        ts: times.sunset,
        body: {
            command: 'snapshot'
        }
    });

    message.save(session, callback);
}

// setup the day's sunset photo at 1am PST every morning.
// 1am in Los Angeles is not a common sunrise/sunset time anywhere highly populated in the world (sorry American Samoa)
new cron.CronJob({
    cronTime: '01 00 00 * * *',
    timeZone: 'America/Los_Angeles',
    onTick: setupSnapshots
}).start();

setupSnapshots();