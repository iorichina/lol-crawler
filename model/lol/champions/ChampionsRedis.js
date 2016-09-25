var redis                   = INCLUDE('/lib/redis/RedisClients'),
    env                     = '',
    config                  = CONFIG.redis.lol.connect,
    RestUtils               = INCLUDE('/lib/RestUtils'),
    listKey                 = CONFIG.redis.lol.championsListKey,
    type_champion_list      = 'z:champion:list',
    type_champion_data      = 'h:champion:data',
    type_champion_version   = 'h:champion:version';
module.exports  = {
    setEnv  : function(e) {
        if (!e) {
            return this;
        }
        env = e;
        listKey = listKey + env + ":";
        return this;
    },
    getChampionListCount : function(callback) {
        mfunc_run(function(err, client, release_client) {
            if (err) {
                callback.call(null, 'redis client error');
                return;
            };
            client.zcard(mfunc_genListKey(type_champion_list), function(){
                callback.apply(null, arguments);
                release_client();
            });
        });
    },
    getChampionList : function(callback, start, stop) {
        start   = start || 0;
        stop    = stop || 0;
        mfunc_run(function(err, client, release_client) {
            if (err) {
                callback.call(null, 'redis client error');
                return;
            };
            var data    = [mfunc_genListKey(type_champion_list), start, stop, 'WITHSCORES'];
            client.zrange(data, function(err, res){
                callback.call(null, err, res, start, stop);
                release_client();
            });
        });
    },
    saveChampionList : function(champions, callback) {
        mfunc_run(function(err, client, release_client) {
            if (err) {
                callback.call(null, 'redis client error');
                return;
            };
            var data = [mfunc_genListKey(type_champion_list)];
            for (var p in champions) {
                data.push(p);
                data.push(champions[p]);
            }
            client.zadd(data, function(){
                callback.apply(null, arguments);
                release_client();
            });
        });
    },
    saveChampionData : function(id, champion, callback) {
        mfunc_run(function(err, client, release_client) {
            if (err) {
                callback.call(null, 'redis client error');
                return;
            };
            client.hmset(mfunc_genListKey(type_champion_data+":"+id), champion, function(err, res){
                callback(err, res, id);
                release_client();
            });
        });
    },
    saveChampionVersion : function(version, callback) {
        mfunc_run(function(err, client, release_client) {
            if (err) {
                callback.call(null, 'redis client error');
                return;
            };
            var data = [mfunc_genListKey(type_champion_version)];
            for (var p in version) {
                data.push(p);
                data.push(version[p]);
            }
            client.hmset(data, function(){
                callback.apply(null, arguments);
                release_client();
            });
        });
    }
};
function mfunc_run(callback) {
    redis.getRedisClient(config, callback);
}
function mfunc_genListKey(type, key) {
    key = key || '';
    return listKey+type+(key ? RestUtils.md5(key) : key);
}