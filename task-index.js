require('./global').init(__dirname);
var util    = require('util');

// cd /home/www/lnp/lol-source/ && node task-index.js action=import-champions env=en
var log     = '[[['+process.argv.join(' ')+' ';
var argv    = process.argv.slice(2),
    action  = argv[0] ? argv[0] : '',
    action  = action.split('='),
    action  = action[0] === 'action' ? action[1] : null,
    action  = action ? action : 'import-champions',
    app     = INCLUDE('/app/task/'+action);
util.log(log+'task:'+action+']]]');
app.run(argv.slice(1), action);