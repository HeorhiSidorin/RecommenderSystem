var express = require('express');
var fs = require('fs');
var app = express();

app.get('/', function(req, res){
    console.log('GET /')
    var topArticles = fs.readFileSync('top-article.json','utf-8');
    res.writeHead(200, {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': 'http://www.tut.by'});
    res.end(topArticles);
});

port = 3000;
app.listen(port);
console.log('Listening at http://localhost:' + port);

setInterval(function(){
	console.log("started...");
	require('child_process').exec('node system.js');
},300000)