require('webduino-blockly');
require('webduino-bit-modules');


var matrix;


boardReady({board: 'Bit', device: 'NYPc38tBjiE3SERUvK', transport: 'mqtt'}, function (board) {
  board.samplingInterval = 250;
  matrix = getMatrix(board, 4, 25);
  matrix.setColorByString('000000000100000002ffffff03000000040000000500000006ffffff0700000008ffffff090000000affffff0b0000000c0000000d0000000effffff0f00000010ffffff1100000012ffffff13000000140000001500000016ffffff1700000018000000');
});


