var server = require('http').Server();
var io = require('socket.io').listen(server);
var fs = require('fs');

// Set up the static file http server
server.on('request', function (req, res) {
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

// Set up the socket.io connection to the web page
var connected = null;

io.on('connection', function (socket) {
  connected = socket;
  
  socket.on('disconnect', function() {
    connected = null;
  });
});

server.listen(8088);

// Set up the connection to the Arduino running BasicIMU firmware with a Pololu MinIMU-9 attached
var reflecta = require('../../reflecta.js');
reflecta.detect(function(error, boards, ports) {

  if (error) {
    console.log(error);
    return;
  }

  var board = boards[0];

  board.hart1.setFrameRate(10);

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
        
	// Calibration data from my MinIMU-9 magnometer, find your own values
	var maxX = 114;
    var minX = -160;
    var maxY = 145;
    var minY = -117;

    // Following algorithm from pololu MinIMU-9-Arduino-AHRS Compass.ino without the tilt compensation
    var magX = (hbData.magnometer.x - minX) / (maxX - minX) - 0.5;
    var magY = (hbData.magnometer.y - minY) / (maxY - minY) - 0.5;

    var heading = Math.atan2(-magY, magX) * 180 / Math.PI;
    if (heading < 0) heading += 360; // Stay positive, people

    if (connected) {
      connected.emit('magnometer', { heading: heading });
    }

  });
});