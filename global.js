var path        = require('path');
var config      = require('config');
module.exports  = {
    init    : function(root_path) {
        root_path           = root_path || __dirname;

        global.CONFIG       = config;
        global.PATH         = path;
        global.ROOT_PATH    = root_path;
        global.INCLUDE      = function(modulePath) {
            if (modulePath.indexOf('/') === 0)
                return require(PATH.join(ROOT_PATH, modulePath));
            return require(modulePath);
        };
        global.APP_LOG      = function() {
            var args = [].slice.call(arguments);
            args.unshift('[' + (new Date().toUTCString()) + ']');
            console.log(args.join(' '))
        };
    }
};