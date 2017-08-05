var teacherNamespace = (socket) => {
  socket.emit('score', 'You joined the room');
};

var studentJoined = (socket, name, socket_id) => {
  socket.emit('score', 'A student joined the room');
  socket.emit('new_user', name, socket_id);
};

var greeting = (socket, name) => {
  socket.emit('score', name + ' said hello');
};

var updateNumber = (socket, name, number) => {
  socket.emit('score', 'the total is now ' + number);
  socket.emit('update_guess_total', number);
};

var returnScore = (socket, name, number) => {
  socket.emit('score', name  + '\'s score is ' + number);
};

var updatePersonGuess = (socket, name, number) => {
  socket.emit('enter_number', name, number);
  socket.emit('score', name + ' entered ' + number);
};

var announceWinner = (socket, name) => {
  socket.emit('announceWinner', name);
};

var changeButtonState = (socket, action) => {
  socket.emit('changeButtonState', action);
};

var updateProgress = (socket, guess_count) => {
  socket.emit('updateProgress', guess_count);
};

var studentNamespace = (socket) => {
  socket.emit('score', 'You joined the room');

}

module.exports.teacherNamespace = teacherNamespace;
module.exports.studentNamespace = studentNamespace;
module.exports.studentJoined = studentJoined;
module.exports.greeting = greeting;
module.exports.updateNumber = updateNumber;
module.exports.updatePersonGuess = updatePersonGuess;
module.exports.returnScore = returnScore;
module.exports.announceWinner = announceWinner;
module.exports.changeButtonState = changeButtonState;
module.exports.updateProgress = updateProgress;