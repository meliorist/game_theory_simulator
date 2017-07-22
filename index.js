const express = require('express'),
  socketio = require('socket.io'),
  process = require('process'),
  config = require('./config.js'),
  socketioRedis = require('socket.io-redis'),
  router = require('./routes.js'),
  sockets = require('./sockets.js'),
  redis = require('redis');

var app = express();
// take the port as an argument so you can potentially run off of more than one server
var server = app.listen(process.argv[2]);
var io = socketio(server);

/* app.use(express.static('static')); */

//setup express to use middleware
app.use('/', router);
console.log(__dirname + '/static/js');
app.use('/js', express.static(__dirname + '/static/js'));

var redisClient = redis.createClient(config.redis_port, config.redis_host);
redisClient.set("GUESS_TOTAL",0);

var teacher = io.of('/teacher');
var student = io.of('/student');
teacher.on('connection', sockets.teacherNamespace);
student.on('connection', sockets.studentNamespace);

io.adapter(socketioRedis({host: config.redis_host, port: config.redis_port}));
teacher.on('connection', (socket) => {
  socket.on('room.join', (room) => {
    console.log(socket.rooms);
    Object.keys(socket.rooms).filter((r) => r != socket.id)
    .forEach((r) => socket.leave(r));

    setTimeout(() => {
      socket.join(room);
      socket.emit('event', 'Joined room ' + room);
      socket.broadcast.to(room).emit('event', 'Someone joined room ' + room);
    }, 0);
  })

  socket.on('get_score', (e) => {
  	console.log(e.room);
    redisClient.get(e.name,(err,reply) => {
      console.log(reply);
      sockets.returnScore(teacher, e.name, parseInt(reply));
    });
  });
  
  socket.on('clear_total', (e) => {
    redisClient.set("GUESS_TOTAL",0);
    teacher.emit('event', 'Total of guesses was cleared');
  });

  socket.on('announceWinner', (e) => {
  	console.log("Announce Winner");
    sockets.announceWinner(student, "Sam");
  });

  socket.on('event', (e) => {
    socket.broadcast.to(e.room).emit('event', e.name + ' says hello!');
  });

});
student.on('connection', (socket) => {
  socket.on('room.join', (room, name) => {
    console.log(socket.rooms);
    Object.keys(socket.rooms).filter((r) => r != socket.id)
    .forEach((r) => socket.leave(r));

    sockets.studentJoined(teacher, name);
    socket.broadcast.to(room).emit('new_user', name);

    setTimeout(() => {
      socket.join(room);room
      socket.broadcast.to(room).emit('event', 'Someone joined room ' + room);
    }, 0);
  })

  socket.on('event', (e) => {
  	console.log(e.room);
    //socket.broadcast.to(e.room).emit('event', e.name + ' says hello!');
    sockets.greeting(teacher, e.name);
  });

  socket.on('enter_number', (e) => {
    //socket.broadcast.to(e.room).emit('enter_number', e.name + ' entered ' + e.number);
    sockets.updatePersonGuess(teacher, e.name, e.number);
    redisClient.set(e.name,parseInt(e.number));
    redisClient.get("GUESS_TOTAL",(err,reply) => {
      console.log(reply);
      redisClient.set("GUESS_TOTAL",(parseInt(reply) + parseInt(e.number)));
      //socket.broadcast.to(e.room).emit('event', ' the total is now ' + (parseInt(reply) + e.number));
      sockets.updateNumber(teacher, e.name, (parseInt(reply) + parseInt(e.number)));
    });
  });
});