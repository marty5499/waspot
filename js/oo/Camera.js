class Camera {
  constructor(idx) {
    this.remote = typeof idx == "string" && idx.indexOf('ws') == 0;
    if (this.remote) {
      this.url = idx;
    } else {
      this.cameraList = [];
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
      if (window.WebSocket) {
        var video = document.getElementById(eleId);
        remoteVideo = video;
        ConnectWebSocket(this.url);
      }
    } else {
      var ele = document.getElementById(eleId);
      this.onStream(function (stream) {
        ele.srcObject = stream;
      });
    }
  }

  onCanvas(canvasId, callback) {
    this.start();
    var canvas = document.getElementById(canvasId);
    var video = document.createElement('video');
    video.autoplay = true;
    if (this.remote) {
      if (window.WebSocket) {
        remoteVideo = video;
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