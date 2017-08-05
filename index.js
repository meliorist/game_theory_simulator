const express = require('express'),
  socketio = require('socket.io'),
  process = require('process'),
  config = require('./config.js'),
  socketioRedis = require('socket.io-redis'),
  router = require('./routes.js'),
  sockets = require('./sockets.js'),
  student_obj = require('./student.js'),
  redis = require('redis');

var app = express();
// take the port as an argument so you can potentially run off of more than one server
var server = app.listen(process.argv[2]);
var io = socketio(server);
var students_arr = new Array();

/* app.use(express.static('static')); */

//setup express to use middleware
app.use('/', router);
console.log(__dirname + '/static/js');
// this allows the server to serve js files to the html pages
app.use('/js', express.static(__dirname + '/static/js'));

var redisClient = redis.createClient(config.redis_port, config.redis_host);
redisClient.flushdb( function (err, succeeded) {
  console.log(succeeded); // will be true if successfull
});
redisClient.set("guess_total",0);
redisClient.set("student_count",0);
redisClient.set("guess_count",0);

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
    redisClient.set("guess_total",0);
    teacher.emit('event', 'Total of guesses was cleared');
  });

  socket.on('announceWinner', (e) => {
    sockets.announceWinner(student, "Sam");
  });

  socket.on('enable_buttons', (e) => {
    sockets.changeButtonState(student, "enable");
  });

  socket.on('disable_buttons', (e) => {
    sockets.changeButtonState(student, "disable");
  });

  socket.on('event', (e) => {
    socket.broadcast.to(e.room).emit('event', e.name + ' says hello!');
  });

});

student.on('connection', (socket) => {
	socket.on('disconnect', function(room, name) {
  	teacher.emit('event', socket.id + " left the room");
  	/* to do: keep track of the user's name against the socket.id so we know who left */
  });
  
  socket.on('room.join', (room, name) => {
    console.log(socket.rooms);
    Object.keys(socket.rooms).filter((r) => r != socket.id)
    .forEach((r) => socket.leave(r));

    sockets.studentJoined(teacher, name, socket.id);
    socket.broadcast.to(room).emit('new_user', name);
    redisClient.hset("user:" + socket.id, "name", name, function(err, reply){
    	if (err) console.log("error saving the user's name: " + err);
    });
    // update the count of students who are in the room
    redisClient.get("student_count",(err,reply) => {
      redisClient.set("student_count",(parseInt(reply) + 1));
    });
  	students_arr.push(new student_obj(socket.id));

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
    // update the guess value for this user
    redisClient.hset("user:" + socket.id, "guess", e.number, function(err, reply){
    	if (err) console.log("error saving the user's guess: " + err);
    });
    // update the guess count and broadcast to the students as a progress indicator
    redisClient.get("guess_count",(err,reply) => {
      redisClient.set("guess_count",(parseInt(reply) + 1));
      sockets.updateProgress(student, (parseInt(reply) + 1));    	
    });
    redisClient.get("guess_total",(err,reply) => {
      redisClient.set("guess_total",(parseInt(reply) + parseInt(e.number)));
      sockets.updateNumber(teacher, e.name, (parseInt(reply) + parseInt(e.number)));
    });
  });
});

function calculateWinner(result) {
  winner_name = null;
  winner_guess = null;
  var target_value = 0;
  
  // calculate the target value
  redisClient.get("guess_total",(err, guess_total) => {
    if (err) console.log("error getting the guess total: " + err);
    redisClient.get("guess_count",(err, guess_count) => {
      if (err) console.log("error getting the guess count: " + err); else {
        if (guess_count == 0) var gave = 0; else var gave = parseInt(guess_total/guess_count);
	      target_value = parseInt(gave * .667);
	      console.log(target_value);
	      redisClient.keys("*", function(err, key_list) {
          var keys = Object.keys(key_list);
          var diff = 100000;
          keys.forEach(function (l) {
            redisClient.hget(key_list[l], "name", function(err, user_name) {
              if (!err) {
        	      // no error means that the hash field exists - probably a better way of doing this
                redisClient.hget(key_list[l], "guess", function(err, user_guess) {
                  if (!err) {
                    var this_diff = Math.abs(user_guess - target_value);
                    if (this_diff < diff) {
                      diff = this_diff;	
                      winner_name = user_name;
                      console.log(user_name);
                      winner_guess = user_guess;
                    }
                  }
                });
              }
            });
          });
	      });
        result(winner_name, winner_guess);
      }
    });
  });
}