class Actor {
  constructor(cv, info) {
    var self = this;
    self.running = false;
    self.cv = cv;
    self.info = info;
    self.img = null;
    self.imgReady = false;
    self.touching = false;
    this.lastInsideTime = -1;
    self.stage = info.stage; // camera
    self.moveArray = [];
    self.isFlip = self.stage.getFlip();
    self.body = document.getElementsByTagName('body')[0];
    self.originImgURL = info.img;
    self.originSize = [info.pos[3], info.pos[4]];
    self.setImg(info.img, info.pos);
    self.hide();
    self.audio = new Audio(info.snd);
    self.jsonInfo = {
      "history": 100,
      "varThreshold": 25,
      "learningRate": 0.001,
      "detectShadows": false,
      "objMinSize": 3,
      "touchTime": 1000,
      "filter": ["e2", "g1", "d3"]
    };
    self.onTouchCallback = function () { };
    self.setTracking({
      'inside': function (pos) {
        var nowTime = new Date().getTime();
        if (nowTime - this.lastInsideTime < self.jsonInfo.touchTime) {
          self.touching = true;
          return;
        }
        self.touching = false;
        this.lastInsideTime = nowTime;
        if (self.isHide()) return;
        self.inPos = pos;
        self.onTouchCallback(pos);
      },
      'outside': function (pos) {
        self.outPos = pos;
      }
    });
  }

  play() {
    this.audio.play();
    return this;
  }

  showTime() {
    this.tracking.scan();
  }

  switchImg(url, switchTime) {
    var self = this;
    if (self.touching) return;
    self.jsonInfo.touchTime = switchTime * 1000;
    var lastPos = [self.x, self.y, self.width, self.height];
    self.setImg(url, lastPos);
    setTimeout(function () {
      self.setImg(self.originImgURL, lastPos);
    }, self.jsonInfo.touchTime);
  }

  setImg(url, pos) {
    var self = this;
    if (arguments.length == 1) {
      pos = [self.x, self.y];
    }
    if (self.img != null && self.imgReady) {
      self.body.removeChild(this.img);
    }
    var canvas = self.stage.getCanvas();
    self.img = new Image();
    self.imgReady = false;
    self.img.onload = function () {
      self.imgReady = true;
      this.style.position = 'absolute';
      this.style.left = self.getCanvas().offsetLeft + pos[0] + 'px';
      this.style.top = self.getCanvas().offsetTop + pos[1] + 'px';
      self.body.appendChild(this);
    };
    self.img.src = url;
    self.x = pos[0];
    self.y = pos[1];
    self.width = self.img.width;
    self.height = self.img.height;
    if (pos.length == 4) {
      self.width = this.info.pos[2];
      self.height = this.info.pos[3];
      self.img.style.width = self.width + 'px';
      self.img.style.height = self.height + 'px';
    }
    return this;
  }

  getCanvas() {
    return this.stage.getCanvas();
  }

  moveTo(x, y) {
    //support array [x,y]
    if (arguments.length == 1) {
      y = x[1];
      x = x[0];
    }
    if (this.running) {
      this.x = x;
      this.y = y;
      this.img.style.display = '';
      var offsetLeft = this.getCanvas().offsetLeft;
      var offsetTop = this.getCanvas().offsetTop;
      this.img.style.left = offsetLeft + this.x + "px";
      this.img.style.top = offsetTop + this.y + "px";
      this.tracking.moveTo(x, y);
    } else {
      this.moveArray.push([x, y]);
    }
    return this;
  }

  isHide() {
    return this.img.style.display == 'none';
  }

  hide() {
    this.img.style.display = 'none';
  }

  show() {
    this.img.style.display = '';
  }

  getStage() {
    return this.stage;
  }

  onTouch(callback) {
    this.onTouchCallback = callback;
  }

  setTracking(callback) {
    var x = this.x;
    var y = this.y;
    this.tracking =
      new Hotspot(this.getCanvas(), this.getCanvas(), true,
        x, y,
        x + this.width, y,
        x + this.width, y + this.height,
        x, y + this.height);
    this.tracking.setFlip(this.isFlip);
    this.tracking.jsonInfo = this.jsonInfo;
    //this.tracking.debug();
    this.tracking.setCvProcess(this.cv.imgFilter);

    if (typeof callback['inside'] == "function") {
      this.tracking.inside(callback['inside']);
    }
    if (typeof callback['outside'] == "function") {
      this.tracking.outside(callback['outside']);
    }
    return this;
  }

  start() {
    var self = this;
    self.stage.onReady(function () {
      //console.log("stage ready , Actor start..");
      self.tracking.start();
      self.running = true;
      for (var i = 0; i < self.moveArray.length; i++) {
        self.moveTo(self.moveArray.shift());
      }
    });
    self.stage.onCanvas(function (c) {
      self.showTime();
    });
  }
}