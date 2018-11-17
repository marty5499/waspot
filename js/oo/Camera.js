class Camera {

  // 0,1,2 or http:// ws://192.168.43.204:8889/rws/ws
  constructor(idx) {
    this.cameraList = [];
    this.remote = typeof idx == "string";
    if (this.remote) {
      this.idx = -1;
      this.url = idx;
    } else {
      this.idx = arguments.length == 0 ? 0 : parseInt(idx);
    }
  }

  list(cb) {
    var self = this;
    navigator.mediaDevices.enumerateDevices()
      .then(function (o) {
        self.gotDevices(self, o);
        cb(self.cameraList);
      }).catch(self.handleError);
  }

  async init() {
    if (this.idx == -1) return;
    var self = this;
    return new Promise(function (resolve, reject) {
      navigator.mediaDevices.enumerateDevices()
        .then(function (o) {
          self.gotDevices(self, o);
          resolve();
        }).catch(self.handleError);
    });
  }

  gotDevices(self, deviceInfos) {
    for (var i = 0; i !== deviceInfos.length; ++i) {
      var deviceInfo = deviceInfos[i];
      if (deviceInfo.kind === 'videoinput') {
        self.cameraList.push(deviceInfo);
      }
    }
  }

  async start() {
    await this.init();
    if (this.idx == -1) return;
    if (window.stream) {
      window.stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
    var deviceId = 0;
    try {
      deviceId = this.cameraList[this.idx].deviceId;
    } catch (e) {
      console.log("can't found idx:", this.idx, "error:", e);
      console.log(this.cameraList);
    }
    var constraints = {
      video: {
        deviceId: { exact: deviceId }
      }
    };
    var self = this;
    navigator.mediaDevices.getUserMedia(constraints).
    then(function (stream) {
      if (self.stream) {
        self.stream(stream);
      }
    }).catch(this.handleError);
  }

  onStream(stream) {
    this.stream = stream;
  }

  handleError(error) {
    console.log('Error: ', error);
  }

  toVideo(eleId) {
    this.start();
    if (eleId.charAt(0) == '#') {
      eleId = eleId.substring(1);
    }
    if (this.remote) {
      if (this.remote.indexOf("ws://") == 0) {
        if (window.WebSocket) {
          var video = document.getElementById(eleId);
          this.remoteVideo = video;
          ConnectWebSocket(this.url);
        }
      } else if (this.remote.indexOf("http://") == 0) {
        console.log("ESP32 Camera");
      }
    } else {
      var ele = document.getElementById(eleId);
      this.onStream(function (stream) {
        ele.srcObject = stream;
      });
    }
  }

  drawRotated(canvas, image, degrees) {
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(degrees * Math.PI / 180);
    context.drawImage(image, -image.width / 2, -image.width / 2);
    context.restore();
  }

  onCanvas(canvasId, callback) {
    this.start();
    var canvas = typeof canvasId === 'object' ?
      canvasId : document.getElementById(canvasId);
    var video;
    if (this.remote && this.url.indexOf("ws://") == 0) {
      video = document.createElement('video');
      video.autoplay = true;
      if (window.WebSocket) {
        this.remoteVideo = video;
        ConnectWebSocket(this.url);
        video.onloadeddata = function () {
          var loop = function () {
            canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight,
              0, 0, canvas.width, canvas.height);
            if (typeof callback == 'function')
              callback(canvas);
            requestAnimationFrame(loop);
          }
          requestAnimationFrame(loop);
        }
      }
    } else if (this.remote && this.url.indexOf("http://") == 0) {
      var self = this;
      var espCamImg = document.createElement('img');
      espCamImg.width = 224;
      espCamImg.height = 224;
      espCamImg.setAttribute("crossOrigin", 'Anonymous');
      var camSnapshotDelay = 0.5;
      var param = this.url.indexOf("?");
      if (param > 0) {
        camSnapshotDelay = parseFloat(this.url.substring(param + 1)) * 1000;
        this.url = this.url.substring(0, param);
      }
      espCamImg.src = this.url;
      var ctx = canvas.getContext('2d');
      espCamImg.onload = function () {
        self.drawRotated(canvas, espCamImg, 90);
        if (typeof callback == 'function') {
          callback(canvas);
        }
        setTimeout(function () {
          espCamImg.src = self.url + "?" + Math.random();
        }, camSnapshotDelay);
      }
    } else {
      this.onStream(function (stream) {
        video.srcObject = stream;
        var loop = function () {
          canvas.getContext('2d').drawImage(video, 0, 0, video.videoWidth, video.videoHeight,
            0, 0, canvas.width, canvas.height);
          if (typeof callback == 'function')
            callback(canvas);
          requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
      });
    }
  }
}