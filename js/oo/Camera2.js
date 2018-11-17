let Camera = (function () {
  const webCam = 0;
  const wsCam = 1;
  const httpCam = 2;

  class Camera {
    // 0,1,2 or http:// ws://192.168.43.110:8889/rws/ws
    constructor(camType) {
      this.setCamType(camType);
    }

    setCamType(camType) {
      this.cameraList = [];
      if (isNaN(parseInt(camType))) {
        this.URL = camType;
        if (camType.indexOf("ws://") == 0) {
          this.camType = wsCam;
        } else if (camType.indexOf("http://") == 0) {
          this.camType = httpCam;
        }
      } else {
        this.camType = camType;
      }
    }

    enumerateDevices() {
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

    async startCam() {
      switch (this.camType) {
        case webCam:
          await this.enumerateDevices();
          if (window.stream) {
            window.stream.getTracks().forEach(function (track) {
              track.stop();
            });
          }
          var deviceId = 0;
          try {
            deviceId = this.cameraList[this.camType].deviceId;
          } catch (e) {
            console.log("can't found camType:", this.camType, "error:", e);
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
            if (self.video) {
              self.video.srcObject = stream;
            }
          }).catch(function (error) {
            console.log('Error: ', error);
          });
          break;
          /* WebRTC */
        case wsCam:
          console.log("WebRTC:", this.camType);
          ConnectWebSocket(this.URL);
          break;
        case httpCam:
          // http://192.168.43.201:9966/ok.png
          console.log("HTTPCam:", this.camType);
          console.log("URL:", this.URL);
          break;
      }
    }

    getEle(eleOrId) {
      return typeof eleOrId === 'object' ?
        eleOrId : document.getElementById(eleOrId);
    }

    onImage(imageId_or_ele, callback) {
      var self = this;
      var image = this.getEle(imageId_or_ele);
      image.setAttribute("crossOrigin", 'Anonymous');
      var camSnapshotDelay = 0.5;
      var param = this.URL.indexOf("?");
      if (param > 0) {
        camSnapshotDelay = parseFloat(this.URL.substring(param + 1)) * 1000;
        this.URL = this.URL.substring(0, param);
      }
      image.src = this.URL;
      image.onload = function () {
        //self.drawRotated(canvas, image, 90);
        setTimeout(function () {
          image.src = self.URL + "?" + Math.random();
          console.log("refresh image:", image.src);
        }, camSnapshotDelay);
      }
    }

    onCanvas(canvasId_or_ele, callback) {
      this.startCam();
      var canvas = this.getEle(canvasId_or_ele);
      var video = this.createVideo(callback);
      window.remoteVideo = this.video = video;
      video.onloadeddata = function () {
        var loop = function () {
          var ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight,
            0, 0, canvas.width, canvas.height);
          if (typeof callback == 'function') {
            callback(canvas);
          }
          requestAnimationFrame(loop);
        }
        requestAnimationFrame(loop);
      }
    }

    toVideo(eleOrId) {
      this.startCam();
      window.remoteVideo = this.video = typeof eleOrId === 'object' ?
        eleOrId : document.getElementById(eleOrId);
    }

    createVideo(callback) {
      var video = document.createElement('video');
      video.autoplay = true;
      return video;
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
  }

  return Camera;
})();