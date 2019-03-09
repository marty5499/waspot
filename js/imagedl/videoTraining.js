import { ImageDL } from './imageDL';
import { CaptureCanvas } from './CaptureCanvas';

var ready = false;
var NUM_CLASSES = prompt("請輸入預設識別種類數量", "4");
var imageDL = new ImageDL(+NUM_CLASSES);
//imageDL.setServer('http://codegen/');
imageDL.setServer('https://localhost:3000/');
imageDL.load();

var labels = [];
for (var i = 0; i < NUM_CLASSES; i++) {
  var cc = new CaptureCanvas(i, 'c1', 'zone');
  labels.push(cc);
  cc.captureImage(function (label, img) {
    ready = false;
    imageDL.addExample(img, label);
    console.log("add Label:", label);
  });
}

window.train = function () {
  var x = 0;
  window.setMsg("開始訓練.....");
  imageDL.train(function () {
    ready = true;
  });
}

//new Camera(0 ).onCanvas('c1', function (canvas) {
//new Camera('ws://192.168.0.199:8889/rws/ws').onCanvas('c1', function (canvas) {

var cameraPos = 0;
if (location.hash != "") {
  cameraPos = location.hash.substring(1);
}

new Camera(cameraPos).onCanvas('c1', function (canvas) {
  if (!ready) return;
  const img = new Image();
  img.src = canvas.toDataURL();
  img.onload = function () {
    imageDL.predict(img, function (idx, c) {
      var status = document.getElementById("status");
      status.innerHTML = "辨識標籤為..." + idx + ",信心水準：" + parseInt(c * 1000000) / 10000.0 + " %";
      for (var i = 0; i < labels.length; i++) {
        labels[i].highlight(idx == i);
      }
    });
  }
});
