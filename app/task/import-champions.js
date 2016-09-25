var http            = require('http'),
    cheerio         = require('cheerio'),
    ChampionsRedis  = INCLUDE('/model/lol/champions/ChampionsRedis'),
    config          = CONFIG.task.lol.champions,
    action_name     = 'import-champions',
    env             = '';// 'en'

module.exports      = {
    run : function() {
        if (arguments[0] && arguments[0][0]) {
            var arg = arguments[0][0].split('=');
            if (arg[0] === 'env' && arg[1].trim()) {
                env = arg[1].trim();
                ChampionsRedis.setEnv(env);
                config = CONFIG.task[env].lol.champions;
            }
        }
        
        mfunc_run.apply(this, arguments);
    }
};

function mfunc_run(argv, action_name) {
    APP_LOG('data-source:'+config.url);
    action_name = (action_name ? action_name : this.action_name) + ':';
    http.get(config.url, function(res){
        log =action_name + "Got response status: " + res.statusCode;
        APP_LOG(log);

        var size    = 0,
            chunks  = [];
        res.on('data', function(chunk){
            size    += chunk.length;
            chunks.push(chunk);
        });
        res.on('end', function(){
            var data    = Buffer.concat(chunks, size);
            data        = data.toString();
            
            var on_save = function(LOLherojs) {
                ChampionsRedis.saveChampionList(LOLherojs.champion.keys, function(err, res) {
                    APP_LOG('saveChampionList:', err ? err : 'ok');
                });

                mfunc_saveChampionDatas(LOLherojs.champion.data);

                ChampionsRedis.saveChampionVersion({version: LOLherojs.champion.version, updated: LOLherojs.champion.updated}, function(err, res) {
                    APP_LOG('saveChampionVersion:', err ? err : 'ok');
                });
            }
            if ('en' === env) {
                // 美服的数据是一串json字符串
                mfunc_parseChampionJsonDatas(data.toString(), on_save);
            }else{
                // 国服的数据是一个js文件；
                mfunc_parseChampionJsDatas(data, on_save);
            }

        });
    }).on('error', function(e){
        log = action_name + 'error:'+e.message;
        APP_LOG(log);
    });
}
function mfunc_saveChampionDatas(data) {
    var data_count  = 0;
    for (var p in data) {
        var champion = data[p];
        if (champion['image'] && Object.prototype.toString.call(champion['image']) === "[object Object]") {
            champion['image'] = JSON.stringify(champion['image']);
        }
        if(Object.prototype.toString.call(champion['tags']) === "[object Array]") {
            champion['tags'] = champion['tags'].join(',');
        }
        if (champion['stats'] && Object.prototype.toString.call(champion['stats']) === "[object Object]") {
            champion['stats'] = JSON.stringify(champion['stats']);
        }
        
        ChampionsRedis.saveChampionData(p, champion, function(err, res, key) {
            console.log('saveChampionData:', key, ':', err ? err : 'ok');
        });
        data_count++;
    }
    console.log('data count: '+data_count);
}
/**
 * 从美服取回的数据解析，模拟国服官方的数据
 * @param  {string} data 从en lol 官方站返回的json响应
 * @return {object}      跟国服的lol数据类似的对象数据
 */
function mfunc_parseChampionJsonDatas(data, on_save) {
    var data        = typeof data === 'string' ? JSON.parse(data) : data,
        now         = new Date(),
        updated     = now.getFullYear()+'-'+(now.getMonth()+1)+'-'+now.getDate(),
        LOLherojs   = {},
        len         = 0,
        ids         = {};
    LOLherojs.champion  = {"keys":{}, "data":{}, "version": data.version, "updated": updated};

    for (var p in data.data) {
        var data_p  = data.data[p];
        LOLherojs.champion.keys[data_p.key] = data_p.id;

        data_p.stats.attackspeed = data_p.stats.attackspeed || 0;
        LOLherojs.champion.data[data_p.id]  = {
            "id": data_p.id,
            "key": data_p.key,
            "name": data_p.name,
            "title": data_p.title,
            "tags": data_p.tags,
            "stats": data_p.stats,
        };
        ids[data_p.id] = len++;
    }

    APP_LOG('ids:', '[object Object]=', JSON.stringify(ids));
    // append attack speed property
    (function(i, len, callback) {
        var detail_url  = [];
        for (var id in LOLherojs.champion.data) {
            var td      = LOLherojs.champion.data[id];
            detail_url.push(config.detail_url.replace('%s', id.toLowerCase()) );
            if (td.stats.attackspeed) {
                APP_LOG('attackspeed:'+td.stats.attackspeed);
                i++;
                continue;
            };
            http.get(detail_url[detail_url.length-1], function(res){
                var size    = 0,
                    chunks  = [];
                res.on('data', function(chunk){
                    size    += chunk.length;
                    chunks.push(chunk);
                });
                res.on('end', function(){
                    try {
                        var data    = Buffer.concat(chunks, size),
                            $       = cheerio.load( data.toString() ),
                            p       = $(".section-wrapper-primary .default-1-3 img").attr("src").match("\\/([^\\/]*?)\\.png")[1],
                            url     = detail_url[ids[p]]
                            as      = $(".stat-as").next().text().trim().match('(.+?)\\(')[1].trim();
                        APP_LOG('detail_url got response:champion='+p+':id='+ids[p]+':url='+url);
                        if (url && as) {
                            LOLherojs.champion.data[p].stats.attackspeed = parseFloat(as);
                        };
                    } catch(e) {}

                    i++;
                    if (i >= len) {
                        callback(LOLherojs);
                    };
                });
            }).on('error', function(e){
                log='url:'+detail_url[detail_url.length-1]+':'+'error:'+e.message;
                APP_LOG(log);
            });
        }
        // APP_LOG('detail_url:', '[object Array]=', detail_url);
    }) (0, len, on_save);
    // without append attack speed property
    // on_save(LOLherojs);
}

function mfunc_parseChampionJsDatas(data, on_save) {
    eval(data);
    
    on_save(LOLherojs);
}