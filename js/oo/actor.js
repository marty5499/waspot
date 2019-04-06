/*
        var obj = new Actor({
            'stage': 'c1',
            'img': 'res/coin.png',
            'snd': 'res/coin.mp3',
            'pos': [100, 100, 25, 25]
        })
*/
class Actor {
  constructor(cv, info) {
    var self = this;
    self.running = false;
    self.cv = cv;
    self.info = info;
    self.img = null;
    self.stage = info.stage; // camera
    self.body = document.getElementsByTagName('body')[0];
    self.setImg(info.img, info.pos);
    self.hide();
    self.audio = new Audio(info.snd);
    self.moveArray = [];
    self.jsonInfo = {
      "history": 100,
      "varThreshold": 25,
      "learningRate": 0.001,
      "detectShadows": false,
      "objMinSize": 5,
      "filter": ["e3", "g1", "d3"]
    };
    self.onTouchCallback = function () {};
    self.setTracking({
      'inside': function (pos) {
        if (self.isHide()) return;
        self.onTouchCallback();
      },
      'outside': function (pos) {
        //console.log("outside");
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

  setImg(url, pos) {
    var self = this;
    if (self.img != null) {
      self.body.removeChild(this.img);
    }
    var canvas = self.stage.getCanvas();
    self.img = new Image();
    self.img.onload = function () {
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
      this.img.style.left = this.getCanvas().offsetLeft + this.x + "px";
      this.img.style.top = this.getCanvas().offsetTop + this.y + "px";
      this.tracking.moveTo(x, y);
      return this;
    } else {
      this.moveArray.push([x, y]);
    }
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
    self.stage.onCanvas(function (c) {
      self.showTime();
    });

    setTimeout(function () {
      console.log("Actor start..");
      self.tracking.start();
      self.running = true;
      for (var i = 0; i < self.moveArray.length; i++) {
        self.moveTo(self.moveArray.shift());
      }
    }, 1000);
  }

}