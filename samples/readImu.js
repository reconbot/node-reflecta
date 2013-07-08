var util = require('util');
var reflecta = require('../reflecta.js');

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
        
    console.log(heartbeat.collectingLoops + " : " + heartbeat.idleLoops + "\n accel " + util.inspect(hbData.accelerometer) + '\n gyro ' + util.inspect(hbData.gyroscope) + '\n  magno ' + util.inspect(hbData.magnometer));
  });

});