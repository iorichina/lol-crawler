var http            = require('http'),
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
