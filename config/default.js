var connect     = {
    host: '172.19.51.112',
    port: 6380
};
module.exports  = {
    redis       : {
        lol     : {
            connect     : mfunc_combineConfig(connect, {db:1}),
            championsListKey : 'lol:champions:'
        }
    },
    task        : {
        lol     : {
            champions:  {
                url : 'http://lol.qq.com/biz/hero/champion.js',
                // tgbus的数据跟其他网站的数据都不相同，暂时不能做国服的，只能做美服的
                property : 'http://lol.tgbus.com/db/hero/%d.shtml',
                // base on root path
                img_path : '../assets-static/img/lol/champions/'
            }
        },
        en      : {
            lol : {
                champions:  {
                    url : 'http://ddragon.leagueoflegends.com/cdn/4.14.2/data/en_US/champion.json',
                    detail_url : 'http://gameinfo.na.leagueoflegends.com/en/game-info/champions/%s/',
                    // base on root path
                    img_path : '../assets-static/img/lol/champions/en/',
                    img_from : 'http://ddragon.leagueoflegends.com/cdn/4.14.2/img/champion/%s.png',
                    big_img_path : '../assets-static/img/lol/champions/en-980x500/',
                    big_img_from : 'http://ossweb-img.qq.com/images/lol/web201310/skin/big%d000.jpg'
                }
            }
        }
    }
};

function mfunc_combineConfig() {
    var args = [].slice.call(arguments);
    if (args.length <= 1) {
        return args.length == 1 ? args[0] : {};
    }
    var res  = {},
        index= 0;
    for (var i = 0; i < args.length; i++) {
        if (typeof args[i] === 'object') {
            for (var p in args[i]) {
                res[p]  = args[i][p];
            }
        }else{
            res[index++]    = args[i];
        }
    }
    return res;
}
