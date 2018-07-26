require('webduino-blockly');
require('webduino-bit-modules');


var matrix;
var btnA;
var btnB;


boardReady({board: 'Bit', device: 'NYPc38tBjiE3SERUvK', transport: 'mqtt'}, function (board) {
  board.samplingInterval = 250;
  matrix = getMatrix(board, 4, 25);
  btnA = getPullupButton(board, 35);
  btnB = getPullupButton(board, 27);
  btnA.on('pressed', function () {
    matrix.setColorByString('00ff000001ff0000020000000300000004ff000005ff000006ff00000700000008ff0000090000000a0000000b0000000cff00000d0000000e0000000fff000010ff00001100000012ff00001300000014ff000015ff0000160000001700000018ff0000');
  });
  btnB.on('pressed', function () {
    matrix.setColorByString('000000000100000002000000030000000400000005000000060066000700660008006600090000000a0000000b0066000c0066000d0066000e0000000f000000100066001100660012006600130000001400000015000000160000001700000018000000');
  });
  function button_event_20512347() {
    matrix.setColorByString('000000990100009902000099030000990400009905000099060000990700009908000099090000990a0000990b0000990c0000990d0000990e0000990f000099100000991100009912000099130000991400009915000099160000991700009918000099');
  }
  function button_handle_20511696(btn, type) {
    return function () {
      btn.currentStatus = type;
      btnA.currentStatus === "pressed" && btnB.currentStatus === "pressed" && button_event_20512347();
    };
  }
  btnA.on("pressed", button_handle_20511696(btnA,"pressed"));
  btnA.on("released", button_handle_20511696(btnA,"released"));
  btnA.on("longPress", button_handle_20511696(btnA,"longPress"));
  btnB.on("pressed", button_handle_20511696(btnB,"pressed"));
  btnB.on("released", button_handle_20511696(btnB,"released"));
  btnB.on("longPress", button_handle_20511696(btnB,"longPress"));
});

