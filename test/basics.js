var ledPin = 13; // Leonardo

var assert = require('chai').assert;
var util = require('util');
var reflecta = require('../reflecta.js');

function reflectaTestFactory(done, callback) {

  reflecta.detect({ baudrate: 57600, buffersize: 100 }, function(error, boards, ports) {

    if (error) {
      done(new Error(error));
      return;
    }

    var errorHandler = function(error) {
      console.log("e: " + error);
      boards[0].close(function() {
        done(error);
      });
    };

    boards[0].on('error', errorHandler);
    boards[0].on('warning', function(warning) { console.log("w: " + warning); });
    boards[0].on('message', function(message) { console.log("m: " + message); });
    boards[0].on('close', function() { });
    boards[0].on('end', function() { console.log('end'); });
    boards[0].on('open', function() { console.log('open'); });

    boards[0].endTest = function endTest(done) {
      boards[0].on('error', function() { });
      boards[0].removeListener('error', errorHandler);
      boards[0].close(done);
    };

    callback(boards[0]);
  });
}

describe('Basic Reflexes', function() {
    
  it('QueryInterface Responds', function(done) {
      
    reflectaTestFactory(done, function(board) {    

      board.on('response', function(response) {
        board.endTest(done);
      });
      
      board.sendFrame(board.FunctionIds.queryInterface);

    });
  });
  
  it('ardu1 Blinky works', function(done) {

    reflectaTestFactory(done, function(board) {

      var count = 0;
      var toggle = false;

      board.ardu1.pinMode(ledPin, board.ardu1.OUTPUT);

      var toggleLed = function() {

        if (++count > 6) {
          board.endTest(done);
          return;
        }

        toggle ^= 1;
        board.ardu1.digitalWrite(ledPin, toggle);
        board.ardu1.digitalRead(ledPin, function(value) {
          assert.equal(value, toggle);
          setTimeout(toggleLed, 200);
        });
      };

      toggleLed();

    });
  });

  it('PushArray and SendResponseCount properly round trip', function(done) {

    var reflecta = reflectaTestFactory(done, function(board) {

      var w0 = 250;
      var w1 = -97;
      var w2 = 650;
      var w3 = -129;

      var buffer = new Buffer(10);
      buffer[0] = board.FunctionIds.pushArray;
      buffer[1] = 8;
      buffer.writeInt16BE(w0, 2);
      buffer.writeInt16BE(w1, 4);
      buffer.writeInt16BE(w2, 6);
      buffer.writeInt16BE(w3, 8);

      board.sendFrame(buffer);

      board.sendResponseCount(8, function(buffer) {
        var w00 = buffer.readInt16BE(0);
        var w01 = buffer.readInt16BE(2);
        var w02 = buffer.readInt16BE(4);
        var w03 = buffer.readInt16BE(6);

        assert.equal(w0, w00);
        assert.equal(w1, w01);
        assert.equal(w2, w02);
        assert.equal(w3, w03);

        board.endTest(done);
      });
    });

  });

  it('Simple PushArray and SendResponse properly round trip', function(done) {

    var reflecta = reflectaTestFactory(done, function(board) {

      board.sendFrame([board.FunctionIds.pushArray, 1, 99]);

      board.sendResponse(function(buffer) {
        assert.equal(buffer[0], 99);
        assert.equal(buffer.length, 1);

        board.sendFrame([board.FunctionIds.pushArray, 1, 98]);

        board.sendResponseCount(1, function(buffer) {
          assert.equal(buffer[0], 98);
          assert.equal(buffer.length, 1);

          board.sendFrame([board.FunctionIds.pushArray, 2, 98, 99]);

          board.sendResponseCount(2, function(buffer) {
            assert.equal(buffer[0], 98);
            assert.equal(buffer[1], 99);
            assert.equal(buffer.length, 2);
            
          board.endTest(done);
          });
        });
      });
    });
  });
});