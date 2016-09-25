var http            = require('http'),
    cheerio         = require('cheerio'),
    ChampionsRedis  = INCLUDE('/model/lol/champions/ChampionsRedis'),
    config          = CONFIG.task.lol.champions,
    action_name     = 'import-champions',
    count           = 0,
    start           = 0;

module.exports      = {
    run : mfunc_run
};

function mfunc_run(argv, action_name) {
    var log = (action_name ? action_name : this.action_name) + ':';
    
    ChampionsRedis.getChampionListCount(function(err, res) {
        if (err) {
            console.log('getChampionListCount:error:', err);
            return;
        }
        count   = parseInt(res);
        start   = 0;
        mfunc_getChampionList ();
    });
}
function mfunc_getChampionList() {
    if (start >= count) {
        console.log('mfunc_getChampionList:end');
        return;
    }
    ChampionsRedis.getChampionList(mfunc_getChampionListData, start, start);
    start++;
}
function mfunc_getChampionListData(err, res) {
    if (err) {
        console.log('mfunc_getChampionListData:error:', err);
        return;
    }
    console.log(res);
    mfunc_importChampionProperty(res[1], res[0]);
}
function mfunc_importChampionProperty(id, name) {
    var url     = util.format(config.property, id);
    http.get(url, function(res){
        console.log(url + ":Got response: " + res.statusCode);

        var size    = 0,
            chunks  = [];
        res.on('data', function(chunk){
            size    += chunk.length;
            chunks.push(chunk);
            chunk   = null;
        });
        res.on('end', function(){
            var data    = Buffer.concat(chunks, size);
            chunks      = size  = null;
            data        = data.toString();
            mfunc_parsePropertyHtml(cheerio.load(data));
            data        = null;
        });
    }).on('error', function(e){
        log+='error:'+e.message;
        console.log(log);
    });
}
function mfunc_parsePropertyHtml($) {
    var base    = {};
    $(".ml10.pt15.pb15.lh24").split('<br>').forEach(function(value) {
        var $$  = cheerio.load(value),
            type= $$('strong').text().replace(':', '');
        switch(type) {
            case '生命值':
                
        }
    });
}