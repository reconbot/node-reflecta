var ledPin = 11;

var reflecta = require('../reflecta.js');
var board;

reflecta.detect(function(error, boards, ports) {

	if (error) {
		console.log(error);
		return;
	}

	board = boards[0];
	console.log('Board found on ' + ports[0]);

	board.on('error', function(error) { console.log("e: " + error); });
	board.on('warning', function(warning) { console.log("w: " + warning); });
	board.on('message', function(message) { console.log("m: " + message); });

	board.on('close', function() { console.log("close"); });
	board.on('open', function() { console.log("open"); });
	board.on('end', function() { console.log("end"); });

	if (board.ardu1) {
		board.ardu1.pinMode(ledPin, board.ardu1.OUTPUT);
		board.ardu1.digitalWrite(ledPin, 1);
	}

});