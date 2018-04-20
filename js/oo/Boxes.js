// 座標分類盒
class Boxes {
  constructor(dst) {
    this.dst = dst;
    this.boxes = {};
    Object.size = function (obj) {
      var size = 0,
        key;
      for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
      }
      return size;
    };
  }

  getPoint(boxNum) {
    var list = this.boxes[boxNum];
    var x = list[0][0],
      y = list[0][1];
    for (var i = 1; i < list.length; i++) {
      x = (x + list[i][0]) / 2;
      y = (y + list[i][1]) / 2;
    }
    return [x, y];
  }

  getCenter() {
    var list = Object.size(this.boxes);
    var xy = this.getPoint(0);
    var x = xy[0],
      y = xy[1];
    for (var i = 1; i < list.length; i++) {
      var xy = this.getPoint(i);
      x = (x + xy[0]) / 2;
      y = (y + xy[1]) / 2;
    }
    return [x, y];
  }

  process(data) {
    for (var i = 0; i < data.length; i = i + 2) {
      this.processPoint(data[i], data[i + 1]);
    }
  }

  // 每一個盒子都放相近的點
  processPoint(x, y) {
    //debugger;
    var cnt = 0;
    for (var key in this.boxes) {
      //比對盒子中每一個座標
      var grp = this.boxes[key];
      for (var i = 0; i < grp.length; i++) {
        if (this.distance(x, y, grp[i][0], grp[i][1]) < this.dst) {
          grp.push([x, y]);
          return;
        }
      }
      cnt++;
    }
    //都找不到合適的盒子，就建立新盒子
    this.boxes[cnt] = [
      [x, y]
    ];
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  }

  total() {
    return Object.size(this.boxes);
  }

  val(min, max) {
    var list = Object.size(this.boxes);
    var p1 = this.getPoint(0);
    var count = 0;
    for (var i = 1; i < list - 1; i++) {
      var p2 = this.getPoint(i);
      var p3 = this.getPoint(i + 1);
      var angle = this.angle(p1[0], p1[1], p2[0], p2[1], p3[0], p3[1]);
      if (angle >= min && angle <= max) {
        count++;
      }
      p1 = p2;
    }
    return count;
  }

  show() {
    console.log(this.boxes);
  }

  angle(x1, y1, x2, y2, x3, y3) {
    var lengthAB = Math.sqrt(Math.pow(x1 - x2, 2) +
        Math.pow(y1 - y2, 2)),
      lengthAC = Math.sqrt(Math.pow(x1 - x3, 2) +
        Math.pow(y1 - y3, 2)),
      lengthBC = Math.sqrt(Math.pow(x2 - x3, 2) +
        Math.pow(y2 - y3, 2));
    var cosA = (Math.pow(lengthAB, 2) + Math.pow(lengthAC, 2) - Math.pow(lengthBC, 2)) /
      (2 * lengthAB * lengthAC);
    return Math.round(Math.acos(cosA) * 180 / Math.PI);
  }

}