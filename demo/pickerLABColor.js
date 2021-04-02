<html lang="en">

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="../js/webRTC.js"></script>
  <script src="../js/adapter.js"></script>
  <script src="../js/color.js"></script>
  <script src="../js/oo/Camera.js"></script>
  <script src="../js/opencv.js"></script>
  <script src="../js/oo/ImageFilter.js"></script>
  <style>
    #set {
      padding: 5px 15px;
      background: #ccc;
      border: 0 none;
      cursor: pointer;
      -webkit-border-radius: 5px;
      border-radius: 5px;
      font-size: 1.2em;
    }

    input[type=range] {
      -webkit-appearance: none;
      width: 160px;
      height: 20px;
      margin: 10px 50px;
      background: linear-gradient(to right, #16a085 0%, #16a085 100%);
      background-size: 150px 10px;
      background-position: center;
      background-repeat: no-repeat;
      overflow: hidden;
      outline: none;
      zoom: 130%;
      margin: auto;
      margin-bottom: 30px;
    }

    span {
      position: relative;
      width: 60px;
      display: inline-block;
      top: -5px;
    }

    div {
      height: 30px;
    }
  </style>
</head>

<body>
  <h1>Color Picker</h1>
  <canvas id='c1' width=480 height=320></canvas>
  <canvas id='c2' width=480 height=320></canvas>
  <div><span>Lower</span>
    <input id='a1' type="range" min="1" max="180" value="50" oninput="showVal(this)">
    <span id='a1m'>50</span>
    <input id='a2' type="range" min="1" max="255" value="50" oninput="showVal(this)">
    <span id='a2m'>50</span>
    <input id='a3' type="range" min="1" max="255" value="50" oninput="showVal(this)">
    <span id='a3m'>50</span>
  </div>
  <div><span>Higher</span>
    <input id='b1' type="range" min="1" max="180" value="150" oninput="showVal(this)">
    <span id='b1m'>150</span>
    <input id='b2' type="range" min="1" max="255" value="150" oninput="showVal(this)">
    <span id='b2m'>150</span>
    <input id='b3' type="range" min="1" max="255" value="150" oninput="showVal(this)">
    <span id='b3m'>150</span>
  </div>
  <div><span>erosion</span>
    <input id='e' type="range" min="0" max="100" value="0" oninput="showVal(this)">
    <span id='em'>0</span>
  </div>
  <div><span>dilation</span>
    <input id='d' type="range" min="0" max="100" value="0" oninput="showVal(this)">
    <span id='dm'>0</span>
  </div>
  <div>setting: <input id='set' type="input" size='80'>
  </div>
  <script>
    var canvasId = 'c1';
    var bs, work = false;
    var filter = new ImageFilter(cv);
    //var camIdx = location.hash == '' ? 0 : location.hash.substring(1);
    //var cam  =new Camera(camIdx);
    //var cam  =new Camera('http://cam25.local/jpg?0.001');
    var cam  =new Camera(0);
    cam.setAutoScale(true);
    cam.onCanvas(canvasId, function (canvas) {
      test2(canvasId);
    });

    vColor = { "a1m": "1", "a2m": "69", "a3m": "50", "b1m": "91", "b2m": "255", "b3m": "255", "em": "0", "dm": "0" };

    function showVal(ele) {
      document.getElementById(ele.id + 'm').innerHTML = ele.value;
      vColor[ele.id + 'm'] = ele.value;

      var range = {
        low: [parseFloat(vColor.a1m), parseFloat(vColor.a2m), parseFloat(vColor.a3m), 0],
        high: [parseFloat(vColor.b1m), parseFloat(vColor.b2m), parseFloat(vColor.b3m), 255],
        erosion: parseInt(vColor.em),
        dilation: parseInt(vColor.dm)
      };
      var str = JSON.stringify(range);
      document.getElementById('set').value = str;
      console.log(str);
    }

    function test1(id) {
      //new Camera(0).onCanvas(canvasId, function (canvas) {
      let src = cv.imread(id);
      let dstx = new cv.Mat();
      cv.cvtColor(src, dstx, cv.COLOR_BGR2HSV, 0);
      cv.imshow(canvasId, dstx);
      dstx.delete();
      src.delete();
    }

    //http://blog.topspeedsnail.com/archives/2112
    //H:色相 0~179 , S：飽和度 0~255 ,V：明度 0~255
    function test2(id) {
      let src = cv.imread(id);
      let dstx = new cv.Mat();
      cv.cvtColor(src, src, cv.COLOR_RGB2HSV, 0);
      //green:41-59 ,red:120-125 , yellow:80-100
      let blue = {
        "low": [, 50, 50, 0],
        "high": [130, 255, 255, 255]
      }
      let green = {
        "low": [50, 0, 0, 0],
        "high": [70, 255, 255, 255]
      }
      let red = {
        "low": [0, 100, 30, 0],
        "high": [180, 255, 255, 255]
      }
      let yellow = {
        "low": [0, 150, 0, 0],
        "high": [255, 250, 255, 255]
      }
      let range = {
        "low": [parseFloat(vColor.a1m), parseFloat(vColor.a2m), parseFloat(vColor.a3m), 0],
        "high": [parseFloat(vColor.b1m), parseFloat(vColor.b2m), parseFloat(vColor.b3m), 255]
      };

      document.getElementById('a1').value = parseFloat(vColor.a1m);
      document.getElementById('a1m').innerHTML = vColor.a1m;
      document.getElementById('a2').value = parseFloat(vColor.a2m);
      document.getElementById('a2m').innerHTML = vColor.a2m;
      document.getElementById('a3').value = parseFloat(vColor.a3m);
      document.getElementById('a3m').innerHTML = vColor.a3m;
      document.getElementById('b1').value = parseFloat(vColor.b1m);
      document.getElementById('b1m').innerHTML = vColor.b1m;
      document.getElementById('b2').value = parseFloat(vColor.b2m);
      document.getElementById('b2m').innerHTML = vColor.b2m;
      document.getElementById('b3').value = parseFloat(vColor.b3m);
      document.getElementById('b3m').innerHTML = vColor.b3m;

      let low = new cv.Mat(src.rows, src.cols, src.type(),
        range.low);
      let high = new cv.Mat(src.rows, src.cols, src.type(),
        range.high);
      cv.inRange(src, low, high, dstx);
      if (vColor.em > 0) {
        dstx = filter.erosion(dstx, parseFloat(vColor.em));
      }
      if (vColor.dm > 0) {
        dstx = filter.dilation(dstx, parseFloat(vColor.dm));
      }
      cv.imshow('c2', dstx);
      low.delete();
      high.delete();
      src.delete();
      dstx.delete();
    }
  </script>
</body>

</html>