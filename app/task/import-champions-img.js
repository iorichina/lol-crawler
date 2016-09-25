//ddragon.leagueoflegends.com/cdn/4.14.2/img/champion/
var http            = require('http'),
    fs              = require('fs'),
    ChampionsRedis  = INCLUDE('/model/lol/champions/ChampionsRedis'),
    config          = CONFIG.task.lol.champions,
    action_name     = 'import-champions-img',
    img_path        = config.img_path,
    img_from        = config.img_from,
    env             = '',// 'en'
    img_type        = null;// 'big'

// cd /home/www/lnp/lol-source/ && node task-index.js action=import-champions-img env=|en img_type=|big
// env和type参数可选，或值留空;
// 当两个参数一起时，顺序不应搞乱
module.exports      = {
    run : function() {
        arguments   = [].slice.call(arguments);
        if (arguments[0] && arguments[0][0]) {
            // 环境
            var arg = arguments[0][0].split('=');
            if (arg[0] === 'env' && arg[1].trim()) {
                env = arg[1].trim();
                ChampionsRedis.setEnv(env);
                config = CONFIG.task[env].lol.champions;
                img_path= config.img_path;
                img_from= config.img_from;
            }else if (arg[0] === 'img_type' && arg[1].trim() && arg[1].trim()!='null') {
                arguments[0].splice(1, 0, arguments[0][0]);
            }
        }

        if (arguments[0] && arguments[0][1]) {
            // 图片类型
            // 头像：|null
            var arg = arguments[0][1].split('=');
            if (arg[0] === 'img_type' && arg[1].trim() && arg[1].trim()!='null') {
                img_type= arg[1].trim();
                img_path= config[img_type+'_img_path'];
                img_from= config[img_type+'_img_from'];
            }
        }

        img_path        = img_path.indexOf('/')===0?img_path:PATH.join(ROOT_PATH, img_path),
        
        console.log(img_path, img_from);
        mfunc_run.apply(this, arguments);
    }
};

function mfunc_run(argv, action_name) {
    // get list
    mfunc_get_champion(0);
}

function mfunc_get_champion(num) {
    num     = num || 0;
    ChampionsRedis.getChampionList(mfunc_get_next_img, num, num);
}

function mfunc_get_next_img(err, res, start, stop) {
    console.log('mfunc_get_next_img:start-', start, ':stop-', stop, ':', res);
    if (err) {
        console.log('mfunc_get_champion:ChampionsRedis.getChampionList:error', err);
        return;
    }
    if (!res || res.length<1) {
        console.log('mfunc_get_champion:ChampionsRedis.getChampionList:end', res);
        return;
    };
    var filename,url;
    switch (img_type) {
        case 'big':
            url     = img_from.replace('%d', res[1]),
            filename= PATH.basename(url);
            break;

        default:
            url     = img_from.replace('%s', res[0]),
            filename= PATH.basename(url);
    }
    // mfunc_get_champion(stop+1);
    http.get(url, function(res){
        var data  = '';
        res.setEncoding('binary');
        res.on('data', function(chunk){
            data    += chunk;
        });
        res.on('end', function(){
            if (!data) {
                console.log('image data is null');
                mfunc_get_champion(stop+1);
                return;
            };

            filename = PATH.join(img_path + filename);
            fs.writeFile( filename, data, 'binary', function(err){
                if (err) {
                    console.log('image writing error:' + err.message);
                    return null;
                }else{
                    console.log('image ' + filename + ' saved');
                    return filename;
                }
            });

            mfunc_get_champion(stop+1);
        });
    }).on('error', function(e){
        console.log('error:'+e.message);
        mfunc_get_champion(stop+1);
    });
}