var app = require('http').createServer(),
  io = require('socket.io').listen(app),
  fs = require('fs');

app.on('request', function (req, res) {
  console.log(req.url);
  var path = null;
  if (req.url === '/') {
    path = __dirname + '/index.html';
  } else {
    path = __dirname + req.url;
  }

  fs.readFile(path,
    function (err, data) {
      if (err) {
        res.writeHead(500);
        return res.end('Error loading index.html');
      }

      res.writeHead(200);
      res.end(data);
  });
});

app.listen(8088);

var connected = null;

io.sockets.on('connection', function (socket) {
  connected = socket;
  
  socket.on('disconnect', function() {
    connected = null;
  });
});

var util = require('util');
var reflecta = require('../../reflecta.js');
reflecta.detect(function(error, boards, ports) {

  if (error) {
    console.log(error);
    return;
  }

  var board = boards[0];

  board.on('error', function(error) { console.log("e: " + error); });
  board.on('warning', function(warning) { console.log("w: " + warning); });
  board.on('message', function(message) { console.log("m: " + message); });

  board.on('close', function() { console.log("close"); });
  board.on('open', function() { console.log("open"); });
  board.on('end', function() { console.log("end"); });

  board.on('heartbeat', function(heartbeat) {
    
    var hbData = {
      gyroscope: {
        x: heartbeat.data.readFloatLE(32),
        y: heartbeat.data.readFloatLE(28),
        z: heartbeat.data.readFloatLE(24)
      },
      accelerometer: {
        x: heartbeat.data.readFloatLE(20),
        y: heartbeat.data.readFloatLE(16),
        z: heartbeat.data.readFloatLE(12)
      },
      magnometer: {
        x: heartbeat.data.readFloatLE(8),
        y: heartbeat.data.readFloatLE(4),
        z: heartbeat.data.readFloatLE(0)
      }
    };
        
    console.log(heartbeat.collectingLoops + " : " + heartbeat.idleLoops + " : accel " + util.inspect(hbData.accelerometer) + ' : gyro ' + util.inspect(hbData.gyroscope) + ' : magno ' + util.inspect(hbData.magnometer));

    if (connected) {
      connected.emit('magnometer', { heading: hbData.magnometer.x % 360 });
    }
  });
});