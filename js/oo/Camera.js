var Camera = (function () {
  const webCam = 0;
  const wsCam = 1;
  const jpgCam = 2;
  const imgStreamCam = 3;

  class Camera {
    // webCam: 0,1,2
    // jpgCam: http://192.168.0.11/jpg
    // wsCam:  ws://192.168.43.110:8889/rws/ws
    constructor(camType) {
      if (arguments.length == 0) {
        camType = 0;
      }
      this.setCamType(camType);
      this.setFlip(false);
      this.autoScale = false;
      this.setRotate(0);
    }

    setAutoScale(autoScale) {
      this.autoScale = autoScale;
    }

    setCamType(camType) {
      this.cameraList = [];
      if (isNaN(parseInt(camType))) {
        this.URL = camType;
        if (camType.indexOf("ws://") == 0) {
          this.camType = wsCam;
        } else if (camType.indexOf("http://") == 0) {
          if (camType.indexOf(":81/stream") > 0) {
            this.camType = imgStreamCam;
          } else {
            this.camType = jpgCam;
          }
          this.rotate = false;
        }
      } else {
        this.camType = webCam;
        this.webCamSelect = camType;
      }
    }

    setRotate(degrees) {
      this.rotate = degrees;
      return this;
    }

    setFlip(bool) {
      this.flip = bool;
      return this;
    }

    list(callback) {
      var self = this;
      this.enumerateDevices(function () {
        callback(self.cameraList);
      });
    }

    enumerateDevices(cb) {
      var self = this;
      return new Promise(function (resolve, reject) {
        navigator.mediaDevices.enumerateDevices()
          .then(function (o) {
            self.gotDevices(self, o);
            if (cb) cb();
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
            deviceId = this.cameraList[this.webCamSelect].deviceId;
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
        case jpgCam:
          // http://192.168.43.201:9966/ok.png
          console.log("JPGCam:", this.camType);
          console.log("URL:", this.URL);
          break;
        case imgStreamCam:
          // http://192.168.43.201:9966/ok.png
          console.log("imgStreamCam:", this.camType);
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
        camSnapshotDelay = parseFloat(this.URL.substring(param + 1));
        this.URL = this.URL.substring(0, param);
      }
      camSnapshotDelay = camSnapshotDelay * 1000;
      image.src = this.URL;
      image.onload = function () {
        setTimeout(function () {
          if (typeof callback == 'function') {
            callback(image);
          }
          image.src = self.URL + "?" + Math.random();
        }, camSnapshotDelay);
      }
    }

    onCanvas(eleOrId, callback) {
      window.hh = 1;
      var self = this;
      var canvas = self.getEle(eleOrId);
      self.canvas = canvas;
      self.ctx = canvas.getContext("2d");

      this.buttonTrigger(canvas, function () {
        self.startCam();
        switch (self.camType) {
          case webCam:
          case wsCam:
            var video = self.createVideo();
            window.remoteVideo = self.video = video;
            video.onloadeddata = function () {
              var loop = function () {
                var ctx = canvas.getContext('2d');
                var vw = video.videoWidth;
                var vh = video.videoHeight;
                self.rotateImg(video, canvas, self.rotate, true);
                if (typeof callback == 'function') {
                  callback(self.canvas, video);
                }
                requestAnimationFrame(loop);
              }
              requestAnimationFrame(loop);
            }
            break;
          case jpgCam:
            var ele = document.createElement('img');
            self.onImage(ele, function (img) {
              self.rotateImg(ele, canvas, self.rotate, false);
              if (typeof callback == 'function') {
                callback(canvas, ele);
              }
            });
            break;
          case imgStreamCam:
            var ele = document.createElement('img');
            ele.src = self.URL;
            ele.setAttribute("crossOrigin", 'Anonymous');
            ele.style.display = 'none';
            document.getElementsByTagName("body")[0].append(ele);
            var ctx = canvas.getContext('2d');
            var loop = function () {
              self.rotateImg(ele, canvas, self.rotate, false);
              if (typeof callback == 'function') {
                callback(canvas, ele);
              }
              requestAnimationFrame(loop);
            }
            requestAnimationFrame(loop);
            break;
        }
      });
      return this;
    }

    toVideo(eleOrId) {
      var self = this;
      window.remoteVideo = self.video = this.getEle(eleOrId);
      this.buttonTrigger(self.video, function () {
        self.startCam();
      });
    }

    createVideo() {
      var video = document.createElement('video');
      video.autoplay = true;
      return video;
    }

    rotateImg(i, c, degrees, isVideo) {
      var ctx = c.getContext("2d");
      var iw = isVideo ? i.videoWidth : i.naturalWidth;
      var ih = isVideo ? i.videoHeight : i.naturalHeight;
      var cw = c.width;
      var ch = c.height;
      var iRatio = parseInt(100 * iw / ih) / 100;
      var cRatio = parseInt(100 * cw / ch) / 100;
      this.ctx.save();
      if (cw != ch && (cRatio != iRatio) && !this.autoScale) {
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate(degrees * 0.0174532925199432957);
        ctx.translate(-ch / 2, -cw / 2);
        ctx.drawImage(i, 0, 0, iw, ih, 0, 0, ch, cw);
      } else {
        ctx.translate(cw / 2, ch / 2);
        ctx.rotate(degrees * 0.0174532925199432957);
        ctx.translate(-cw / 2, -ch / 2);
        this.drawImg(i, c, isVideo);
      }
      this.ctx.restore();
    }


    drawImg(i, c, isVideo) {
      var iw = isVideo ? i.videoWidth : i.naturalWidth;
      var ih = isVideo ? i.videoHeight : i.naturalHeight;
      var cw = c.width;
      var ch = c.height;
      var sx = 0;
      var sy = 0;
      var cRatio = cw / ch;
      if (iw >= ih) {
        sx = (iw - (ih * cRatio)) / 2;
        iw = ih * cRatio;
      } else {
        sy = (ih - (iw * cRatio)) / 2;
        ih = iw * cRatio;
      }
      this.ctx.drawImage(i, sx, sy, iw, ih, 0, 0, cw, ch);
    }

    buttonTrigger(ele, callback) {
      if (this.camType != 0 && this.camType != jpgCam && this.camType != imgStreamCam) {
        var btn = document.createElement("BUTTON");
        btn.setAttribute("style", "background-color: #e0f0e0;position: fixed;z-index:2;top:5px;left:5px;font-size:96px");
        document.getElementsByTagName("body")[0].append(btn);
        var rect = ele.getBoundingClientRect();
        btn.style.top = rect.top;
        btn.style.left = rect.left;
        btn.style.width = rect.width;
        btn.style.height = rect.height;
        btn.innerHTML = "Start Camera";
        btn.addEventListener('click', function (e) {
          btn.parentNode.removeChild(btn);
          callback();
        });
      } else {
        callback();
      }
    }

    upload(url) {
      this.canvas.toBlob(
        function (blob) {
          var fd = new FormData();
          fd.append('file', blob, "img.jpg");
          fetch(url, {
            method: 'POST',
            mode: 'cors',
            body: fd
          }).then(res => {
            console.log("upload res:", res.status);
          });
        }, 'image/jpeg');
    }
  }
  return Camera;
})();