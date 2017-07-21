const router = require('express').Router();
var path = require('path')

router.get('/student', (req, res) => {
  res.sendFile(path.join(__dirname, 'static/student.html'));
});

router.get('/teacher', (req, res) => {
  res.sendFile(path.join(__dirname, 'static/teacher.html'));
});

module.exports = router;
