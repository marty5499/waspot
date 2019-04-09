class HotBlock {

  constructor(canvasEleOrIdOrCameraObj, canvasEleOrId2) {
    this.alreadyStart = false;
    if (typeof canvasEleOrIdOrCameraObj == 'object'
      && typeof canvasEleOrIdOrCameraObj.getCanvas != "undefined") {
      this.camera = canvasEleOrIdOrCameraObj;
      this.canvas = this.camera.getCanvas();
    }
    else if (typeof canvasEleOrIdOrCameraObj == 'string') {
      this.canvas = document.getElementById(canvasEleOrIdOrCameraObj);
    } else {
      this.canvas = canvasEleOrIdOrCameraObj;
    }

    if (arguments.length == 2) {
      this.debug = true;
      if (typeof canvasEleOrId2 == 'string') {
        this.canvas2 = document.getElementById(canvasEleOrId2);
      } else {
        this.canvas2 = canvasEleOrId2;
      }
    } else {
      this.canvas2 = this.canvas;
    }
    this.filter = new ImageFilter(cv);
    this.trackingList = [];
  }

  delBlock(blockId) {
    var tracking = this.trackingList[blockId];
    if (typeof tracking == "undefined") return;
    tracking.stop();
    delete this.trackingList[blockId];
  }

  getBlock(id) {
    return this.trackingList[blockId];
  }

  setBlock(area, callback) {
    this.delBlock("default");
    this.addBlock({
      "id": "default",
      "area": area,
      "history": 300,
      "learningRate": 0,
      "varThreshold": 150,
      "detectShadows": false,
      "objMinSize": 3,
      "filter": ["e1", "d1"]
    }, callback);
  }


  addBlock(jsonInfo, callback) {
    this.delBlock(jsonInfo['id']);
    var x1 = jsonInfo['area'][0];
    var y1 = jsonInfo['area'][1];
    var x2 = jsonInfo['area'][2];
    var y2 = jsonInfo['area'][3];
    var tracking = new Hotspot(this.canvas, this.canvas2, true,
      x1, y1, x2, y1, x2, y2, x1, y2);
    tracking.blockId = jsonInfo['id'];
    tracking.jsonInfo = jsonInfo;

    if (this.debug) {
      tracking.debug();
    }
    tracking.setCvProcess(this.filter);

    if (typeof callback['inside'] == "function") {
      tracking.inside(callback['inside']);
    }
    if (typeof callback['outside'] == "function") {
      tracking.outside(callback['outside']);
    }
    this.trackingList[tracking.blockId] = tracking;
    return tracking;
  }

  scan() {
    for (var i in this.trackingList) {
      var tracking = this.trackingList[i];
      tracking.scan();
    }
  }

  start(delay) {
    var self = this;
    if (this.alreadyStart) return;
    this.alreadyStart = true;
    this.camera.onCanvas(self.canvas, function (c) {
      self.scan();
    });
    this.startAfter(delay);
  }

  startAfter(delay) {
    var self = this;
    setTimeout(function () {
      console.log("start...");
      for (var i in self.trackingList) {
        var tracking = self.trackingList[i];
        tracking.start();
      }
    }, delay);
  }
}