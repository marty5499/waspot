class ColorROI {
  constructor(srcCanvas, dstCanvas, showArea, poly) {
    if (poly.length == 4) {
      poly = [poly[0], poly[1], poly[2], poly[1], poly[2], poly[3], poly[0], poly[3]];
    }
    this.poly = poly;
    this.showArea = showArea;
    this.tracking = {};
    this.filter = new ImageFilter(cv);
    this.srcCanvas = srcCanvas;
    this.dstCanvas = dstCanvas;
    this.procCanvas = this.createProcCanvas();
    this.srcCtx = this.srcCanvas.getContext("2d");
    this.dstCtx = this.dstCanvas.getContext("2d");
    this.procCtx = this.procCanvas.getContext("2d");
    this.clipROI(poly);
    this.minObjectSize = 6;
    this.setStroke(2, "#ff0000");
    this.startDetect = false;
    this.onColorCallback = function (key, pos) {};
  }

  addTrackingHSV(key, hsvAttr) {
    this.tracking[key] = hsvAttr;
  }

  setStroke(lineWidth, strokeStyle) {
    this.lineWidth = lineWidth;
    this.strokeStyle = strokeStyle;
  }

  start() {
    this.startDetect = true;
  }

  createProcCanvas() {
    var procCanvas = document.createElement('canvas');
    procCanvas.id = "proc" + ("" + Math.random()).substring(2, 5);
    procCanvas.style.display = 'none';
    procCanvas.width = this.srcCanvas.width;
    procCanvas.height = this.srcCanvas.height;
    var body = document.getElementsByTagName("body")[0];
    body.appendChild(procCanvas);
    return procCanvas;
  }

  onColor(callback) {
    this.onColorCallback = callback;
  }

  clipROI(poly) {
    this.procCtx.beginPath();
    this.procCtx.moveTo(poly[0], poly[1]);
    this.procCtx.lineTo(poly[2], poly[3]);
    this.procCtx.lineTo(poly[4], poly[5]);
    this.procCtx.lineTo(poly[6], poly[7]);
    this.procCtx.stroke();
    this.procCtx.clip();
    this.scanX = Math.min.apply(null, [poly[0], poly[2], poly[4], poly[6]]);
    this.scanY = Math.min.apply(null, [poly[1], poly[3], poly[5], poly[7]]);
    this.scanWidth = Math.max.apply(null, [poly[0], poly[2], poly[4], poly[6]]) - this.scanX;
    this.scanHeight = Math.max.apply(null, [poly[1], poly[3], poly[5], poly[7]]) - this.scanY;
  }

  stop() {
    this.startDetect = false;
  }

  scan() {
    var ctx = this.srcCtx;
    this.drawTrackingArea();
    if (!this.startDetect) return;
    for (var key in this.tracking) {
      this.trackingHSV(key, this.tracking[key]);
    }
  }

  trackingHSV(key, range) {
    this.procCtx.drawImage(this.srcCanvas, 0, 0);
    let srcsrc = cv.imread(this.procCanvas.id);
    let rect = new cv.Rect(this.scanX, this.scanY, this.scanWidth, this.scanHeight);
    let src = srcsrc.roi(rect);
    let dstx = new cv.Mat();
    cv.cvtColor(src, src, cv.COLOR_RGB2HSV, 0);
    let low = new cv.Mat(src.rows, src.cols, src.type(), range.low);
    let high = new cv.Mat(src.rows, src.cols, src.type(), range.high);
    cv.inRange(src, low, high, dstx);
    dstx = this.filter.erosion(dstx, range.erosion);
    dstx = this.filter.dilation(dstx, range.dilation);
    // check ball exists !
    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(dstx, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);
    for (var i = 0; i < contours.size(); i++) {
      let cnt = contours.get(i);
      let circle = cv.minEnclosingCircle(cnt);
      if (circle.radius < this.minObjectSize) {
        continue;
      }
      this.onColorCallback(key, {
        x: circle.center.x + this.scanX,
        y: circle.center.y + this.scanY,
        radius: circle.radius
      });
    }
    low.delete();
    high.delete();
    src.delete();
    srcsrc.delete();
    dstx.delete();
    contours.delete();
    hierarchy.delete();
  }

  drawTrackingArea() {
    var offsetX = 0;
    var offsetY = 0;
    var a, b, c, d;
    if (this.showArea && this.lineWidth > 0) {
      if (typeof ti === 'undefined') {
        a = { x: this.poly[0], y: this.poly[1] };
        b = { x: this.poly[2], y: this.poly[3] };
        c = { x: this.poly[4], y: this.poly[5] };
        d = { x: this.poly[6], y: this.poly[7] };
      } else {
        a = ti.getScreenPoint(this.poly[0], this.poly[1]);
        b = ti.getScreenPoint(this.poly[2], this.poly[3]);
        c = ti.getScreenPoint(this.poly[4], this.poly[5]);
        d = ti.getScreenPoint(this.poly[6], this.poly[7]);
      }
      this.dstCtx.lineWidth = this.lineWidth;
      this.dstCtx.strokeStyle = this.strokeStyle;
      this.dstCtx.beginPath();
      this.dstCtx.moveTo(a.x - this.lineWidth * 2 + offsetX, a.y - this.lineWidth * 2 + offsetY);
      this.dstCtx.lineTo(b.x + this.lineWidth * 2 + offsetX, b.y - this.lineWidth * 2 + offsetY);
      this.dstCtx.lineTo(c.x + this.lineWidth * 2 + offsetX, c.y + this.lineWidth * 2 + offsetY);
      this.dstCtx.lineTo(d.x - this.lineWidth * 2 + offsetX, d.y + this.lineWidth * 2 + offsetY);
      this.dstCtx.lineTo(a.x - this.lineWidth * 2 + offsetX, a.y - this.lineWidth * 2 + offsetY);
      this.dstCtx.stroke();
    }
  }

  draw(feeling, pos, style, offsetX, offsetY, offsetR) {
    var ctx;
    offsetX = typeof offsetX == 'undefined' ? 0 : offsetX;
    offsetY = typeof offsetY == 'undefined' ? 0 : offsetY;
    offsetR = typeof offsetR == 'undefined' ? 0 : offsetR;
    if (this.srcCanvas == this.dstCanvas) {
      ctx = this.srcCtx;
    } else {
      ctx = this.dstCtx;
    }
    if (typeof ti != 'undefined') {
      pos.x = ti.getScreenPoint(pos.x, pos.y).x;
      pos.y = ti.getScreenPoint(pos.x, pos.y).y;
    }
    var centerX = pos.x + offsetX;
    var centerY = pos.y + offsetY;
    var radius = pos.radius + offsetR;
    var eyeRadius = radius / 7;
    var eyeXOffset = radius / 3;
    var eyeYOffset = radius / 3.5;
    ctx.fillStyle = style;
    // draw the face circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.lineWidth = 5;
    ctx.strokeStyle = 'white';
    //context.stroke();
    // draw the eyes
    ctx.beginPath();
    var eyeX = centerX - eyeXOffset;
    var eyeY = centerY - eyeXOffset;
    ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI, false);
    var eyeX = centerX + eyeXOffset;
    ctx.arc(eyeX, eyeY, eyeRadius, 0, 2 * Math.PI, false);
    ctx.fillStyle = 'white';
    ctx.fill();
    // draw the mouth
    ctx.beginPath();
    if (feeling == 'smile') {
      ctx.arc(centerX, centerY, radius / 3, 0, Math.PI, false);
    }
    if (feeling == 'wow') {
      ctx.arc(centerX, centerY + radius / 2.5, radius / 4, 0, Math.PI * 2, false);
    }
    if (feeling == 'sad') {
      ctx.arc(centerX, centerY + radius / 3, radius / 4, 0, Math.PI, true);
    }
    ctx.stroke();
  }
}