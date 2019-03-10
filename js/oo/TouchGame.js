class TouchGame {

  constructor(hotBlock) {
    this.hot = hotBlock;
    this.info = {
      "history": 1000,
      "varThreshold": 100,
      "detectShadows": false,
      "objMinSize": 10,
      "filter": ["e3", "g1", "e2", "d5"]
    };
  }


  start() {
    var self = this;
    setInterval(function () {
      var x = parseInt(Math.random() * 640);
      var y = parseInt(Math.random() * 400);
      self.info['id'] = "b" + parseInt(Math.random() * 1000);
      self.info['area'] = [x, y, x + 40, y + 40];
      self.hot.addBlock(self.info, {
        "inside": function (pos) {
          console.log("pos:", this.ctx);
          self.hot.delBlock(this.blockId);
        },
        "outside": function (pos) {
          console.log("pos:", this.ctx);
          this.setStroke(3, "#FF0000");
        }
      });
      self.hot.start();
    }, 1000);
  }

  scan() {
    this.hot.scan();
  }

}