var fs = require('fs');
var events = require('events');
var util = require('util');
var path = require('path');

function Board(port, options) {
    if (!(this instanceof exports.Board)) {
        return new exports.Board(port, options);
    }

    var delay = 0;
    if (options && typeof options.delay === 'number' && options.delay > 0) {
        delay = options.delay;
    }

    var self = this;

    var serialPort = new (require("serialport").SerialPort)(port, options);

    serialPort.once('open', function () {
        var timeoutId = setTimeout(function () {
            self.emit('error', 'Timeout awaiting response to QueryInterface');
        }, delay + 1000);

        self.once('error', function (error) {
            clearTimeout(timeoutId);
        });

        setTimeout(function () {
            self.queryInterface(function (interfaces) {
                self.emit('ready');
            }, timeoutId);
        }, delay);
    });

    var EscapeCharacters = {
        END: 0xC0,
        ESCAPE: 0xDB,
        ESCAPED_END: 0xDC,
        ESCAPED_ESCAPE: 0xDD
    };

    var ReadState = {
        FrameStart: 0,
        ReadingFrame: 1,
        FrameEnded: 2,
        FrameInvalid: 3
    };

    var FrameTypes = {
        Reset: 0x7A,
        Heartbeat: 0x7B,
        Response: 0x7C,
        Message: 0x7D,
        Warning: 0x7E,
        Error: 0x7F
    };

    var ErrorCodes = {
        0x00: 'OutOfSequence',
        0x01: 'UnexpectedEscape',
        0x02: 'CrcMismatch',
        0x03: 'UnexpectedEnd',
        0x04: 'BufferOverflow',
        0x05: 'FrameTooSmall',
        0x06: 'FunctionConflict',
        0x07: 'FunctionNotFound',
        0x08: 'ParameterMismatch',
        0x09: 'StackOverflow',
        0x0A: 'StackUnderflow',
        0x0B: 'WireNotAvailable'
    };

    this.FunctionIds = {
        pushArray: [0x00],
        queryInterface: [0x01],
        sendResponse: [0x02],
        sendResponseCount: [0x03],
        reset: [0x7A]
    };

    var writeArray = [];
    var writeArrayIndex = 0;

    var writeSequence = 0;
    var writeChecksum = 0;

    var writeEscaped = function (b) {
        switch (b) {
            case EscapeCharacters.END:
                writeArray[writeArrayIndex++] = EscapeCharacters.ESCAPE;
                writeArray[writeArrayIndex++] = EscapeCharacters.ESCAPED_END;
                break;
            case EscapeCharacters.ESCAPE:
                writeArray[writeArrayIndex++] = EscapeCharacters.ESCAPE;
                writeArray[writeArrayIndex++] = EscapeCharacters.ESCAPED_ESCAPE;
                break;
            default:
                writeArray[writeArrayIndex++] = b;
                break;
        }

        writeChecksum ^= b;
    };

    var readArray = [];
    var readArrayIndex = 0;

    var readState = ReadState.FrameStart;

    var readSequence = 0;
    var readChecksum = 0;

    var escaped = false;
    var readUnescaped = function () {
        var b = readArray[readArrayIndex++];

        if (escaped) {
            escaped = false;
            switch (b) {
                case EscapeCharacters.ESCAPED_END:
                    return EscapeCharacters.END;
                case EscapeCharacters.ESCAPED_ESCAPE:
                    return EscapeCharacters.ESCAPE;
                default:
                    self.emit('warning', 'Local: frame corrupt, unexpected escape');
                    readState = ReadState.FrameInvalid;
                    return null;
            }
        }

        if (b === EscapeCharacters.ESCAPE) {
            escaped = true;
            return null;
        }

        if (b === EscapeCharacters.END) {
            switch (readState) {
                case ReadState.FrameInvalid:
                    readState = ReadState.FrameStart;
                    break;
                case ReadState.ReadingFrame:
                    readState = ReadState.FrameEnded;
                    break;
                default:
                    self.emit('warning', 'Local: frame corrupt, unexpected end');
                    readState = ReadState.FrameInvalid;
                    break;
            }
        }

        return b;
    };

    var frameSequence = 0;

    var frameBuffer = [];
    var frameIndex = 0;

    var parseFrame = function (data) {
        readArray = data;
        readArrayIndex = 0;

        while (readArrayIndex < readArray.length) {
            var b = readUnescaped();

            if (b === null) {
                continue;
            }

            switch (readState) {
                case ReadState.FrameInvalid:
                    break;

                case ReadState.FrameStart:
                    frameSequence = b;

                    if (readSequence++ !== frameSequence) {
                        readSequence = frameSequence + 1;
                    }

                    readChecksum = b;

                    frameBuffer = [];

                    frameIndex = 0;

                    readState = ReadState.ReadingFrame;

                    break;

                case ReadState.ReadingFrame:
                    frameBuffer[frameIndex++] = b;
                    readChecksum ^= b;

                    break;

                case ReadState.FrameEnded:
                    if (readChecksum !== 0) {
                        self.emit('warning', 'Local: frame corrupt, crc mismatch', data, readChecksum);
                    } else {
                        switch (frameBuffer[0]) {
                            case FrameTypes.Error:
                                self.emit('error', 'Remote: ' + frameBuffer[1] + ' : ' + ErrorCodes[frameBuffer[1]]);

                                break;

                            case FrameTypes.Warning:
                                self.emit('warning', 'Remote: ' + frameBuffer[1] + ' : ' + ErrorCodes[frameBuffer[1]]);

                                break;

                            case FrameTypes.Message:
                                var length = frameBuffer[1];
                                self.emit('message', new Buffer(frameBuffer).toString('utf8', 2, length + 2));

                                break;

                            case FrameTypes.Response:
                                var responseToSequence = frameBuffer[1];
                                var frameLength = frameBuffer[2];
                                var responseData = new Buffer(frameBuffer).slice(3, frameLength + 3);
                                self.emit('response', { sequence: responseToSequence, data: responseData });

                                break;

                            case FrameTypes.Heartbeat:
                                var collectingLoops = frameBuffer[1] + (frameBuffer[2] << 8);
                                var idleLoops = frameBuffer[3] + (frameBuffer[4] << 8);
                                self.emit('heartbeat', { collectingLoops: collectingLoops, idleLoops: idleLoops, data: new Buffer(frameBuffer).slice(5, frameBuffer.length - 1) });

                                break;

                            default:
                                self.emit('frame', { sequence: frameSequence, data: new Buffer(frameBuffer) });

                                break;
                        }
                    }

                    readState = ReadState.FrameStart;
                    break;
            }
        }
    };

    serialPort.on('data', parseFrame);
    serialPort.on('open', function () {
        self.emit('open');
    });
    serialPort.on('close', function () {
        self.emit('close');
    });
    serialPort.on('end', function () {
        self.emit('end');
    });
    serialPort.on('error', function (err) {
        self.emit('error', err);
    });

    events.EventEmitter.call(this);

    this.close = function close(callback) {
        self.sendFrame(self.FunctionIds.reset);
        serialPort.close(callback);
    };

    this.sendFrame = function sendFrame() {
        var frame = new Buffer(0);

        for (var i = 0; i < arguments.length; i++) {
            var data = arguments[i];

            if (!Buffer.isBuffer(data)) {
                if (isNaN(data)) {
                    data = new Buffer(data);
                } else {
                    data = new Buffer([data]);
                }
            }

            frame = Buffer.concat([frame, data]);
        }

        if (writeSequence === 256) {
            writeSequence = 0;
        }

        writeChecksum = 0;
        writeArray = [];
        writeArrayIndex = 0;

        writeEscaped(writeSequence);

        for (var index = 0; index < frame.length; index++) {
            writeEscaped(frame[index]);
        }

        writeEscaped(writeChecksum);

        writeArray[writeArrayIndex++] = EscapeCharacters.END;

        serialPort.write(writeArray);

        return writeSequence++;
    };

    this.pushArray = function pushArray(array) {
        self.sendFrame(self.FunctionIds.pushArray, array);
    };

    this.queryInterface = function queryInterface(callback, timeoutId) {
        var callSequence = self.sendFrame(self.FunctionIds.queryInterface);

        function findInterfaceModules(reflectaInterfaces) {
            if (reflectaInterfaces.length === 0) {
                callback(self.interfaces);
            } else {
                var reflectaInterface = reflectaInterfaces.pop();
                var interfaceModule = 'reflecta_' + reflectaInterface.id;

                try  {
                    self[reflectaInterface.id] = require(interfaceModule)(self, reflectaInterface.offset);
                    self.interfaces[reflectaInterface.id] = self[reflectaInterface.id];

                    findInterfaceModules(reflectaInterfaces);
                } catch (error) {
                    self.emit('message', 'QueryInterface: local interface definition not found for ' + reflectaInterface.id);

                    console.log('searching for ' + reflectaInterface.id);
                    var npm = require('npm');
                    npm.load(function (error, npm) {
                        npm.install(interfaceModule, function (error) {
                            if (error) {
                                self.emit('warning', 'QueryInterface: npm registry interface definition not found for ' + reflectaInterface.id + ', ' + error);
                            } else {
                                self[reflectaInterface.id] = require(interfaceModule)(self, reflectaInterface.offset);
                                self.interfaces[reflectaInterface.id] = self[reflectaInterface.id];
                            }

                            findInterfaceModules(reflectaInterfaces);
                        });
                    });
                }
            }
        }

        var queryInterfaceHandler = function queryInterfaceHandler(response) {
            if (response.sequence === callSequence) {
                clearTimeout(timeoutId);

                self.removeListener('response', queryInterfaceHandler);

                self.interfaces = {};

                var interfaceIds = [];
                for (var interfaceIndex = 0; interfaceIndex < response.data.length / 6; interfaceIndex++) {
                    var offset = response.data[interfaceIndex * 6];
                    var id = response.data.slice(interfaceIndex * 6 + 1, interfaceIndex * 6 + 6).toString();
                    interfaceIds.push({ id: id, offset: offset });
                }

                findInterfaceModules(interfaceIds);
            }
        };

        self.on('response', queryInterfaceHandler);
    };

    this.sendResponseCount = function sendResponseCount(count, callback) {
        var callSequence = self.sendFrame([self.FunctionIds.pushArray, 1, count, self.FunctionIds.sendResponseCount]);

        var sendResponseCountHandler = function (response) {
            if (response.sequence === callSequence) {
                self.removeListener('response', sendResponseCountHandler);

                callback(response.data);
            }
        };

        self.on('response', sendResponseCountHandler);
    };

    this.sendResponse = function sendResponse(callback) {
        var callSequence = self.sendFrame(self.FunctionIds.sendResponse);

        self.once('response', function (response) {
            if (response.sequence === callSequence) {
                callback(response.data);
            }
        });
    };
}
exports.Board = Board;

util.inherits(exports.Board, events.EventEmitter);

function detect(options, callback) {
    if (callback === undefined) {
        callback = options;
        options = undefined;
    }

    require("serialport").list(function (error, results) {
        if (error) {
            callback(error);
            return;
        }

        var port;
        for (var i = 0; i < results.length; i++) {
            var item = results[i];

            if (item.manufacturer && (item.manufacturer.indexOf('PJRC') !== -1 || item.manufacturer.indexOf('Arduino') !== -1)) {
                port = results[i].comName;
                break;
            }

            if (item.pnpId && item.pnpId.indexOf('Arduino') !== -1) {
                port = results[i].comName;
                break;
            }

            if (item.pnpId && item.pnpId.indexOf('Teensy') !== -1) {
                port = results[i].comName;
                break;
            }
        }

        if (port) {
            var board = new exports.Board(port, options);

            board.once('error', function (error) {
                board.removeAllListeners('ready');

                callback(error, null, [port]);
            });

            board.once('ready', function () {
                callback(null, [board], [port]);
            });
        } else {
            callback('Arduino not found on available serial ports', null, results.map(function (result) {
                return result.comName;
            }));
        }
    });
}
exports.detect = detect;

