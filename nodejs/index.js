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
    encoding: null
});

var requestMainPage = function (callback) {
    var option = {
        uri: 'https://whooing.com/',
        method: 'GET',
    };

    req(option, function (e, r, b) {
        console.log("Request Main Page");
        callback(e, r, b);
    });
};

var requestLoginPage = function (response, body, callback) {
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

    req(option, function (e, r, b) {
        console.log("Request Login Page");
        callback(e, r, b);
    });
};

var requestAttendPage = function (response, body, callback) {
    var option = {
        uri: 'https://whooing.com/',
        method: 'POST',
        form: {
            section_id: 's'
        },
    };

    req(option, function (e, r, b) {
        console.log("Request Attend Page");
        if (!e && b.indexOf('top_user_logout') < 0) {
            callback("Login fail!", r, b);
        } else {
            callback(e, r, b);
        }
    });
};

exports.handler = function (event, context, callback) {
    async.waterfall([
        requestMainPage,
        requestLoginPage,
        requestAttendPage,
    ], function (err) {
        if (err) {
            console.log(err);
        }

        if (callback) {
            callback(null, 'Success');
        }
    });
};
