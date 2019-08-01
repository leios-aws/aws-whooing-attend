const request = require('request');
const config = require('config');
const async = require('async');

var req = request.defaults({
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'ko,en-US;q=0.8,en;q=0.6'
    },
    jar: true,
    gzip: true,
    followAllRedirects: true,
    //encoding: null
});

var requestMainPage = function (result, callback) {
    var option = {
        uri: 'https://whooing.com/',
        method: 'GET',
    };

    req(option, function (err, response, body) {
        result.response = response;
        result.body = body;

        console.log("Request Main Page");
        callback(err, result);
    });
};

var requestLoginPage = function (result, callback) {
    var authConfig = config.get('auth');
    var option = {
        uri: 'https://whooing.com/auth/login',
        method: 'POST',
        form: {
            login: authConfig.id,
            password: authConfig.pw,
            submitting: '1',
            go_to: ''
        },
        headers: {
            'Referer': 'https://whooing.com'
        },
    };

    req(option, function (err, response, body) {
        result.response = response;
        result.body = body;

        console.log("Request Login Page");
        callback(err, result);
    });
};

var requestAttendPage = function (result, callback) {
    var option = {
        uri: 'https://whooing.com/',
        method: 'POST',
        form: {
            section_id: 's'
        },
    };

    req(option, function (err, response, body) {
        result.response = response;
        result.body = body;

        console.log("Request Attend Page");
        if (!err && body.indexOf('top_user_logout') < 0) {
            callback("Login fail!", result);
        } else {
            callback(err, result);
        }
    });
};

var checkPoint = function (result, callback) {
    var option = {
        uri: 'https://whooing.com/account/personal?ajax=true&_=1564623019847',
        method: 'GET',
        qs: {
            ajax: true,
            _: Date.now()
        },
    };

    req(option, function (err, response, body) {
        result.response = response;
        result.body = body;

        console.log("Check Point");

        if (!err) {
            var matches = body.match(/([0-9,]+)p &nbsp;/);
            if (matches.index > -1) {
                result.data.point = parseInt(matches[1].replace(/,/, ''), 10);
            }
        }
        callback(err, result);
    });
};

exports.handler = function (event, context, callback) {
    async.waterfall([
        function (callback) {
            callback(null, { data: {} });
        },
        requestMainPage,
        requestLoginPage,
        requestAttendPage,
        checkPoint,
    ], function (err, result) {
        if (err) {
            console.log(err);
        } else {
            console.log(result.data);
        }



        if (callback) {
            callback(null);
        }
    });
};
