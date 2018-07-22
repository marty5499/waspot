export class CaptureCanvas {

  constructor(label, canvasId, insertEle) {
    console.log("create CaptureCanvas");
    this.label = label;
    this.canvas = document.getElementById(canvasId);
    this.appendHtml(document.getElementById(insertEle));
    this.imageCount = 0;
  }

  highlight(on) {
    if (on) {
      this.ele.style['background-color'] = '#77cc66';
    } else {
      this.ele.style['background-color'] = '';
    }
  }

  showImageCount(count) {
    this.ele.children[2].innerHTML = "" + count;
  }

  appendHtml(el) {
    var div = document.createElement('div');
    div.innerHTML = '<div class="dropzone" id="' + this.label +
      '" unselectable="on" onselectstart="return false;"><span >' + this.label +
      '</span><div class="preview"><img width="224" height="224"></div>' +
      '<div style="position:relative;top:-30px;font-size:24px;text-align:right;margin-right:10px;z-index:5;color:#aaaaaa">0</div></div>';
    this.ele = div.children[0];
    while (div.children.length > 0) {
      el.appendChild(this.ele);
    }
    window.ee = this.ele;
    var self = this;
    self.ele.addEventListener('mousedown', function (event) {
      self.captureID = setInterval(function () {
        self.ele.style['background-color'] = '#FF0000';
        self.ele.style['color'] = '#FFFFFF';
        self.capture();
      }, 100);
      return false;
    });
    self.ele.addEventListener('mouseup', function (event) {
      self.ele.style['background-color'] = '';
      self.ele.style['color'] = '#000000';
      clearInterval(self.captureID);
    });
  }

  captureImage(callback) {
    this.callback = callback;
  }

  capture() {
    var img = this.ele.children[1].children[0];
    img.src = this.canvas.toDataURL();
    var self = this;
    img.onload = function () {
      self.callback(self.label, img);
      self.showImageCount(self.imageCount++);
    };
  }

}