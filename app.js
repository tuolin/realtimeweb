
/**
 * Module dependencies.
 */

// Command Constants
var LOGIN = 1, USERID = 2, DRAW = 4;

var express = require('express');
var ws = require("websocket-server")

var app = module.exports = express.createServer();

var nextUserId = 1;
var users = new Array();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index', {
    title: '实时webDemo',
    layout: false
  });
});

app.listen(3000);

var wsserver = ws.createServer();
wsserver.addListener("connection", function(connection) {
	
	connection.addListener("message", function(msg) {
		wsOnMessage(connection, msg);
	});
});

function wsOnMessage(con, msg) {
	console.log("got message: " + msg);
	var cmd = msg.split(',');
	switch (parseInt(cmd[0]))
	{
		case LOGIN:
			console.log("sending back user id");
			onLogin(con);
			break;
		case DRAW:
			con.broadcast(msg);
			break; 
	}
}

function onLogin(con) {
	var id = nextUserId++;
	var user = {id:id, con:con};
	users.push(user);
	var str = USERID + ',' + id;
	con.send(str);
}

wsserver.listen(8080);
console.log("Express server listening on port %d", app.address().port);
