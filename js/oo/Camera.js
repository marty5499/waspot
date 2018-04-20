class Camera {
  constructor(idx) {
    if (typeof idx == 'string' && idx.indexOf('ws') == 0) {
      this.remote = true;
      this.url = idx;
    } else {
      this.remote = false;
      this.cameraList = [];
      this.idx = arguments.length == 0 ? 0 : idx;
      var self = this;
      navigator.mediaDevices.enumerateDevices()
        .then(function (o) {
          self.gotDevices(self, o);
        }).catch(this.handleError);
    }
  }

  gotDevices(self, deviceInfos) {
    for (var i = 0; i !== deviceInfos.length; ++i) {
      var deviceInfo = deviceInfos[i];
      if (deviceInfo.kind === 'videoinput') {
        self.cameraList.push(deviceInfo);
      }
    }
    //console.log(self.cameraList);
    self.start();
  }

  toVideo(eleId) {
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

  start() {
    if (window.stream) {
      window.stream.getTracks().forEach(function (track) {
        track.stop();
      });
    }
    var constraints = {
      video: {
        deviceId: { exact: this.cameraList[this.idx].deviceId }
      }
    };
    var self = this;
    navigator.mediaDevices.getUserMedia(constraints).
    then(function (stream) {
      self.stream(stream);
    }).catch(this.handleError);
  }

  onStream(stream) {
    this.stream = stream;
  }

  handleError(error) {
    console.log('Error: ', error);
  }

  onCanvas(canvasId, callback) {
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