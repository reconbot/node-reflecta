var ledPin = 11; // Teensy LED pin

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

	console.log('Board found on ' + ports[0]);

	if (board.ardu1) {
		console.log('Found ardu1 interface, turning on LED');
		board.ardu1.pinMode(ledPin, board.ardu1.OUTPUT);
		board.ardu1.digitalWrite(ledPin, 1);
	}

	if (board.moto1) {
		console.log('Found moto1 interface, exercising motors');
		board.moto1.configure(2, 1, 9, 0, 4, 3, 0, 10, 1, 4); // Override pins for a Teensy
		board.moto1.initialize();

		board.moto1.drive(100, 100);

		setTimeout(function() {

			board.moto1.readCurrent(function(c0, c1) { console.log(c0 + ' : ' + c1); });			

			setTimeout(function() {

				board.moto1.brakeGround();
				board.moto1.readCurrent(function(c0, c1) { console.log(c0 + ' : ' + c1); });			
			}, 500);
		}, 500);
	}
});