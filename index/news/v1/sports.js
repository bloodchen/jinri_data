var path = require('path');
var async = require('async');
var util = require('util');

var basis = require('../lib/basis.js');
var config = require('../lib/config.js');
var helper = require('../lib/helper.js');
var common = require('./common.js');

var api_eastday = 'https://sports.eastday.com/data/json_aoyou.js';
var api_yiyouliao = 'https://yiyouliao.com/rss/aoyou/list/json?channel=sprots'

var source_sport = require('./schema/source_cars.json');
var source_index_sport = require('./schema/source_index_car.json')

var output_index_path = path.join(config.dataPath, 'index/news/v1', 'sports.json');
var output_sub_path = path.join(config.dataPath, 'news', 'sports.json');

var category = '新闻-体育';

function fetch (cb) {
    async.parallel({
        eastday: function (next) {
            basis.fetch(api_eastday, common.source_default_schema, next);
        },
        yiyouliao: function (next) {
            basis.fetch(api_yiyouliao, source_index_sport, next);
        }
    }, cb);
}

function makeup (data, next) {
    var result = {};
    var yiyouliao = data.yiyouliao.data.news;

    var midImg = yiyouliao.midImg.concat(yiyouliao.bigImg);

    var text = yiyouliao.text.map(function (item) {
        return [ item ]
    }).slice(0, 30);

    result.eastday = common.makeup(data.eastday);

    result.yiyouliao = {
        focus: yiyouliao.focus,
        text: text,
        midImg: midImg
    }

    next(null, result);
}

function record (data, cb) {
    async.parallel([
        function (next) {
            basis.save(output_index_path, data.yiyouliao, common.result_index_schema, [api_yiyouliao], next)
        },
        function (next) {
            basis.save(output_sub_path, data.eastday.sub, common.result_sub_schema, [api_eastday], next)
        }
    ], cb)
}

function cron () {
    async.waterfall([fetch, makeup, record], function (err) {
        basis.log(category, err);
    })
}

cron();