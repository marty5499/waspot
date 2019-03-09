class HotBlock {

  constructor(canvasEleOrId, canvasEleOrId2) {
    console.log("arguments.length :", arguments.length);
    if (typeof canvasEleOrId == 'string') {
      this.canvas = document.getElementById(canvasEleOrId);
    } else {
      this.canvas = canvasEleOrId;
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

  addBlock(jsonInfo, callback) {
    var x1 = jsonInfo['area'][0];
    var y1 = jsonInfo['area'][1];
    var x2 = jsonInfo['area'][2];
    var y2 = jsonInfo['area'][3];
    var tracking = new Hotspot(this.canvas, this.canvas2, true,
      x1, y1, x2, y1, x2, y2, x1, y2);
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
    this.trackingList.push(tracking);
  }

  scan() {
    for (var i in this.trackingList) {
      var tracking = this.trackingList[i];
      tracking.scan();
    }
  }

  start() {
    var self = this;
    setTimeout(function () {
      for (var i in self.trackingList) {
        var tracking = self.trackingList[i];
        tracking.start();
        tracking.out();
      }
      console.log("start...");
    }, 3000);
  }
}