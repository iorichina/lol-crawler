require('./global').init(__dirname);

var http = require('http').createServer(function (req, res) {
    console.log('');
    
    var urlinfo     = require('url').parse(req.url, true),
        queryinfo   = urlinfo.query || {},
        app         = null;
    console.log('[[[api action:'+(queryinfo.action?queryinfo.action:'default')+':'+req.url+']]]');
    app = INCLUDE('/api/'+queryinfo.action);
    app.run(queryinfo, req, res);
}).listen(process.env.NODE_PORT);
