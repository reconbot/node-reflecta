node-reflecta is a node.js client for communicating with an Arduino via the [Reflecta](https://github.com/JayBeavers/Reflecta) protocol.

> _Stability: Low_

### Getting Started

[![Greenkeeper badge](https://badges.greenkeeper.io/reconbot/node-reflecta.svg)](https://greenkeeper.io/)
Install the module with: `npm install reflecta`

```javascript
var reflecta = require('reflecta');

// Connect to a board on serial port ttyACM0 which corresponds to 'first USB serial device attached' in Linux, e.g. first Arduino
var board = new reflecta.Board("/dev/ttyACM0");

board.on('ready', function() {

  // Wait for a response from the Arduino to the frame of data I'm going to send
  board.once('response', function(response) {
    console.log(response);
  });

  // Send a frame of data containing '1'.  '1' happens to map to 'QueryInterface' in ReflectaFunctions
  board.sendFrame([1]);
});
```

### Detecting Arduino Boards

```javascript
var reflecta = require('reflecta');
reflecta.detect(function(error, boards, ports) {

  // Choose the first board found
  var board = boards[0];

  // board is not returned until 'ready' has already fired, no need to wait for board.on('ready')
  board.once('response', function(response) {
    console.log(response);
  });

  board.sendFrame([1]);

});
```

### Board Interfaces

On startup Reflecta probes the Arduino to see what libraries are installed using QueryInterface.  If it finds interfaces, it will automatically load a matching set of functions onto the Reflecta object using node's require or an npm install.  A few well known interfaces that are supported are:

__[ardu1](https://github.com/JayBeavers/reflecta_ardu1)__

The ardu1 interface exposes the Arduino Digital & Analog I/O Functions and Wire and Servo libraries.

__[moto1](https://github.com/JayBeavers/reflecta_moto1)__

The moto1 interface exposes the SparkFun Monster Moto shield with functions like Drive, Brake, and ReadCurrent.

__[hart1](https://github.com/JayBeavers/reflecta_hart1)__

The hart1 interface exposes the settings functions for the Reflecta Heartbeat library such as setFrameRate.

__[rbot1](https://github.com/JayBeavers/RocketBot/tree/master/RocketBaseArduino)__

The rbot1 interface exposes the commands for [RocketBot](https://github.com/JayBeavers/RocketBot) to launch pneumatic straw rockets and control blinky lights such as Animation, Compressor, Valve, and Fire.

An example of how to use interfaces:
```javascript
var reflecta = require('reflecta');
reflecta.detect(function(error, boards, ports) {

  // Choose the first board found
  var board = boards[0];

  board.ardu1.digitalWrite(7, 1); // Set digital pin 7 to on
  board.moto1.drive(50, 50); // Set left and right wheel powers to 50 out of 255
  board.rbot1.Fire(); // Fire a straw rocket

});
```

### Board Methods

```javascript
board.sendFrame(buffer0, ..., bufferN);
```
Sends a frame of data to the Arduino comprised by concatenating the buffers.  Parameters will be auto-converted to a [NodeJS buffer](http://nodejs.org/api/buffer.html) so an array of octets (bytes) or a string is reasonable input.

Auto-generates a sequence number to help in detecting lost packets.
Auto-calculates a simple 8 bit CRC to help detect data corruption.  Auto-escapes data using SLIP escaping to 
turn a stream of data into deliniated frames.

Note:  Be sure that ready event has fired before calling sendFrame.

### Board Events

```javascript
board.on('ready', function() ... );
```

The connection has been opened and reflecta is ready to be used to communicate with the Arduino.

```javascript
board.on('error', function(error) ... );
```

An fatal error was detected in the protocol, such as a buffer overflow or underflow, function id conflict, or error with the communications port.

```javascript
board.on('warning', function(warning) ... );
```

A non-fatal warning was detected in the protocol, anything from out of sequence (dropped frame) to bad CRC or
unexpected SLIP Escape (corrupted data)..

```javascript
board.on('message', function(message) ... );
```

A string message was received.  Generally used for 'println debugging' from the Arduino.  'message' is a UTF8 string.

```javascript
board.on('response', function(response) ... );
```

A response was received to a function executed on the Arduino by a frame sent from this client.

`response` contains properties

- `sequence` contains the sequence number of the frame this is a response to so you can correlate request/response pairs.
- `data` contains the byte[] data for the response.

```javascript
board.on('frame', function(frame) ... );
```

A frame of data was received from the Arduino.  This event is only fired for frames that are not recognized as a known FrameType (e.g. Error, Warning, Message, Response, Heartbeat) by the buffer[0] value.

`frame` contains properties

- `sequence` contains the sequence number of this frame.
- `data` contains the byte[] data for the response.

```javascript
board.on('heartbeat', function() ... );
```

A frame of heartbeat data was received from the Arduino.  Heartbeat is a scheduled delivery of data retrieved from the Arduino, such as the current reading of the digital io or analog io ports.

`heartbeat` contains properties

- `collectingLoops`: number of iterations through loop() while collecting heartbeat data
- `idleLoops`: number of iterations through loop() while waiting for heartbeat timer to expire
- `data`: heartbeat byte[]'s

```javascript
board.on('close', function() ... );
```

The communications port was closed.  A light wrapper over node-serialport's close event.

```javascript
board.on('end', function() ... );
```

The communications port was ended.  A light wrapper over node-serialport's end event.

```javascript
board.on('open', function() ... );
```

The communications port is open.  A light wrapper over node-serialport's open event.

## Working with TypeScript

To recompile the Javascript from the Typescript source, you need a suite of Typescript tools installed with:

```
npm install -g tsc
npm install -g tsd
tsd install node
```

You can then recompile using:

```
tsc reflecta.ts
```

## Release History

- 0.3.x: Still in early state.  Subject to frequent breaking API changes at this time.
- 0.3.3: Added reflecta.detect(...), renamed ctor from Reflecta to Board to match firmata/johnny-five
- 0.3.4: Moved nodejs client to separate repository (node-reflecta) from Arduino source (Reflecta)
- 0.3.5: Fix breaking change in Arduino Windows drivers that prevented detection of board, Typescript conversion

## Futures

See [this Trello Board](https://trello.com/b/5ZyBFhPb) for planned work.

## License
Copyright (c) 2012 Jay Beavers  
Licensed under the BSD license.