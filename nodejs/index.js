const request = require('request');
const config = require('config');
const async = require('async');
const fs = require('fs');
const path = require('path');
const balance = require('./src/balance.js');

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

var download = function (year, base, callback) {
    //
    var option = {
        uri: `https://whooing.com/export_to/excel/entries`,
        method: 'GET',
        qs: {
            section_id: 's46385',
            start_date: `${year}0101`,
            end_date: `${year}1231`,
            preset: 'p_y_2',
            limit: 51
        },
    };

    console.log(`Downloading ${year}0101 ~ ${year}1231 @ ${base}`);
    let file = fs.createWriteStream(path.join(base, `whooing-${year}0101-${year}1231.xls`));

    req(option)
        .pipe(file)
        .on('finish', function () {
            callback(null);
        })
        .on('error', function (err) {
            callback(err);
        });
};

exports.handler_backup = function (event, context, callback) {
    var startYear = 2015;
    var endYear = new Date().getFullYear();
    var baseDir = path.join("backup", Date.now().toString());

    var whooingConfig = config.get('whooing');

    if (whooingConfig.backup_base_dir && whooingConfig.backup_base_dir.length > 0) {
        baseDir = path.join(whooingConfig.backup_base_dir, Date.now().toString());
    }

    async.waterfall([
        function (callback) {
            callback(null, { data: {} });
        },
        requestMainPage,
        requestLoginPage,
        requestAttendPage,
        function (result, callback) {
            fs.mkdirSync(baseDir, { recursive: true });
            async.timesSeries((endYear - startYear + 1), function (n, callback) {
                download(endYear - n, baseDir, callback);
            }, function (err) {
                callback(err, result);
            });
        },
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

exports.handler = function (event, context, callback) {
    async.waterfall([
        function (callback) {
            callback(null, { data: {} });
        },
        requestMainPage,
        requestLoginPage,
        requestAttendPage,
        checkPoint,
        balance.processBalance,
    ], function (err, result) {
        console.log({err: err, data: result.data});

        if (callback) {
            callback(null);
        }
    });
};
