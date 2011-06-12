
/**
 * Module dependencies.
 */

// Command Constants
var IDLE = 0, LOGIN = 1, USERID = 2, DRAW = 4,
	CHANGECOLOR = 8, CHANGESHAPE = 16, LOGOUT = 32,
	STARTDRAWING = 64, SYNCUSER = 128;

var express = require('express');
var ws = require("websocket-server")

var app = module.exports = express.createServer();

var nextUserId = 1;
var users = {};

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

function User(userId) {
	this.drawing = false;
	this.userId = userId;
	this.oldX = undefined;
	this.oldY = undefined;
	this.color = undefined;
	this.shape = undefined;
	
	this.setDrawing = function(d) {
		this.drawing = d;
	}
	
	this.save = function(x, y) {
		this.oldX = x;
		this.oldY = y;
	}
	
	this.setColor = function(c) {
		this.color = c;
	}
	
	this.setShape = function(s) {
		this.shape = s;
	}
}

function wsOnMessage(con, msg) {
	console.log("got message: " + msg);
	var cmd = msg.split('|');
	switch (parseInt(cmd[0]))
	{
		case IDLE:
			console.log("idle");
			break;
		case LOGIN:
			console.log("sending back user id");
			onLogin(con);
			break;
		case DRAW:
			users[cmd[1]].save(cmd[2], cmd[3]);
			con.broadcast(msg);
			break; 
		case CHANGECOLOR:
			users[cmd[1]].setColor(cmd[2]);
			con.broadcast(msg);
			break; 
		case STARTDRAWING:
			users[cmd[1]].save(cmd[2], cmd[3]);
			con.broadcast(msg);
			break; 
	}
}

function onLogin(con) {
	var id = nextUserId++;
	var user = new User(id);
	users[id] = user;
	var str = [USERID,id].join('|');
	con.send(str);
	
	// let other client know a new user has joined
	str = [LOGIN, id].join('|');
	con.broadcast(str);
	
	// synchronize other clients that joined before this connection
	for (var k in users) {
		if (k != id && users.hasOwnProperty(k)) {
			var u = users[k];
			var msg = [SYNCUSER, u.userId, u.oldX, u.oldY, u.color, u.shape].join('|');
			con.send(msg);
		}
	}
}

wsserver.listen(8080);
console.log("Express server listening on port %d", app.address().port);
