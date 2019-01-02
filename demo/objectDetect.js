+(function (factory) {
  if (typeof exports === 'undefined') {
    factory(webduino || {});
  } else {
    module.exports = factory;
  }
}(function (scope) {
  'use strict';
  var self;
  var proto;
  var Module = scope.Module;
  var libURL = 'https://marty5499.github.io/webduino-module-deeplearn';
  //libURL = "https://127.0.0.1:8080";

  objectDetect.prototype = proto =
    Object.create(Module.prototype, {
      constructor: {
        value: objectDetect
      }
    });

  function loadJS(filePath) {
    var req = new XMLHttpRequest();
    req.open("GET", filePath, false); // 'false': synchronous.
    req.send(null);

    var headElement = document.getElementsByTagName("head")[0];
    var newScriptElement = document.createElement("script");
    newScriptElement.type = "text/javascript";
    newScriptElement.text = req.responseText;
    headElement.appendChild(newScriptElement);
  }

  function objectDetect(cameraURL, modelURL) {
    Module.call(this);
    var self = this;
    console.log("load yolo...");
    //loadJS('https://marty5499.github.io/webduino-module-deeplearn/yolo.js');
    loadJS(libURL + '/yolo.js');
    this.names = {};
    this.srcCanvas = this.createCanvas('c2', true, 416, 416);
    this.canvasBox = this.createCanvas('c3', false, 416, 416);
    (async function () {
      const model = await tf.loadModel(libURL + '/tfjs-model/model.json');
      new Camera(cameraURL).onCanvas(self.srcCanvas.id, function (canvas) {
        const img = new Image();
        img.src = canvas.toDataURL();
        img.onload = async function () {
          let image = tf.tidy(() => {
            const webcamImage = tf.fromPixels(img);
            const croppedImage = self.cropImage(webcamImage);
            const batchedImage = croppedImage.expandDims(0);
            return batchedImage.toFloat().div(tf.scalar(255));
          });
          const boxes = await yolo(image, model);
          self.drawBoxes(self.srcCanvas, boxes);
        }
      });
    })();
  }

  proto.objInfo = function (name, attr) {
    return this.names[name]['attr'][attr];
  }

  proto.setScreen = function (width, height) {
    this.canvasBox.width = width;
    this.canvasBox.height = height;
  }


  proto.createCanvas = function (id, hidden, width, height) {
    var elem = document.createElement('canvas');
    elem.id = id;
    elem.width = width;
    elem.height = height;
    if (hidden) {
      elem.style.display = 'none';
    }
    document.body.appendChild(elem);
    return elem;
  }


  proto.cropImage = function (img) {
    const size = Math.min(img.shape[0], img.shape[1]);
    const centerHeight = img.shape[0] / 2;
    const beginHeight = centerHeight - (size / 2);
    const centerWidth = img.shape[1] / 2;
    const beginWidth = centerWidth - (size / 2);
    return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
  }

  proto.onName = function (name, callback) {
    this.names[name] = {
      "callback": callback,
      "attr": {}
    };
  }

  proto.filter = "";

  proto.drawBoxes = function (srcCanvas, boxes) {
    var self = this;
    var ctx = this.canvasBox.getContext("2d");
    this.canvasBox.width = this.canvasBox.width;
    ctx.drawImage(this.srcCanvas, 0, 0, this.canvasBox.width, this.canvasBox.height);
    boxes.forEach(box => {
      const {
        top,
        left,
        bottom,
        right,
        classProb,
        className,
      } = box;
      if (self.filter.length == 0 || self.filter.indexOf(className) >= 0) {
        self.drawRect(ctx, left, top, right - left, bottom - top, `${className}`, `${classProb}`);
      }
    });
  }


  proto.drawRect = function (ctx, left, top, width, height, className, classProb) {
    left = parseInt(left);
    top = parseInt(top);
    width = parseInt(width * (this.canvasBox.width / this.srcCanvas.width));
    height = parseInt(height * (this.canvasBox.height / this.srcCanvas.height));
    classProb = (parseInt(classProb * 100) / 100.0);
    var txt = className + " " + classProb;
    ctx.beginPath();
    ctx.lineWidth = "3";
    ctx.strokeStyle = "red";
    ctx.font = "20px Georgia";
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#f50';

    ctx.rect(left, top - 20, width, height);
    var txtWidth = ctx.measureText(txt).width;
    ctx.fillRect(left, top - 20, txtWidth + 4, 20 + 4);

    ctx.fillStyle = '#FFF';
    ctx.fillText(txt, left, top - 20);
    ctx.stroke();

    if (this.names[className] && typeof this.names[className]['callback'] == 'function') {
      this.names[className]['attr'] = {
        "className": className,
        "classProb": classProb,
        "left": left,
        "top": top,
        "width": width,
        "height": height
      };
      this.names[className]['callback'](className, classProb, left, top, width, height);
    }
  }

  scope.module.objectDetect = objectDetect;
}));