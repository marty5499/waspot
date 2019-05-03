var Camera = (function () {
  const webCam = 0;
  const wsCam = 1;
  const jpgCam = 2;
  const imgStreamCam = 3;
  const videoStreamCam = 4;

  class Camera {
    // webCam: 0,1,2
    // jpgCam: http://192.168.0.11/jpg
    // wsCam:  ws://192.168.43.110:8889/rws/ws
    // videoCam: http://127.0.0.1:9966/walkman.mp4
    constructor(camType) {
      if (arguments.length == 0) {
        camType = 0;
      }
      this.cnt = 0;
      this.getImageFailure = false;
      this.onCanvasCallbackList = [];
      this.onReadyCallbackList = [];
      this.setCamType(camType);
      this.setFlip(false);
      this.autoScale = false;
      this.setRotate(0);
      var flipStyle = document.createElement('style')
      this.id = "canvas_" + ("" + Math.random()).substring(2);
      flipStyle.innerHTML = "." + this.id + " {-moz-transform: scaleX(-1);-o-transform: scaleX(-1);-webkit-transform: scaleX(-1);transform: scaleX(-1);filter: FlipH;-ms-filter: 'FlipH';}";
      document.body.appendChild(flipStyle);
    }

    onReady(cb) {
      this.onReadyCallbackList.push(cb);
    }

    setAutoScale(autoScale) {
      this.autoScale = autoScale;
    }

    getCanvas() {
      return this.canvas;
    }

    setCamType(camType) {
      this.cameraList = [];
      if (isNaN(parseInt(camType))) {
        this.URL = camType;
        if (camType.indexOf("ws://") == 0) {
          this.camType = wsCam;
        } else if (camType.indexOf("http://") == 0 || camType.indexOf(".mp4") > 0) {
          if (camType.indexOf(".mp4") > 0) {
            this.camType = videoStreamCam;
          } else if (camType.indexOf(":81/stream") > 0) {
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

    setCanvas(canvas) {
      if (typeof canvas == 'string') {
        canvas = document.getElementById(canvas);
      }
      this.canvas = canvas;
      return this;
    }

    setRotate(degrees) {
      this.rotate = degrees;
      return this;
    }

    setFlip(bool) {
      this.flip = bool;
      return this;
    }

    getFlip() {
      return this.flip;
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
        case videoStreamCam:
          // http://192.168.43.201:9966/walkman.mp4
          console.log("videoStreamCam:", this.camType);
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
      image.src = self.URL;
      image.addEventListener('error', function () {
        self.getImageFailure = true;
        console.log('loading img failed.'); // you could try to load that resource again.
        image.src = self.URL + "?" + Math.random();
      });

      image.onload = function () {
        self.getImageFailure = false;
        setTimeout(function () {
          if (self.onCanvasCallbackList.length > 0) {
            callback(image);
          }
          image.src = self.URL + "?" + Math.random();
        }, camSnapshotDelay);
      }
    }

    onCanvas(eleOrId, callback) {
      var self = this;
      //check if it's callback function
      if (arguments.length == 1
        && typeof eleOrId == 'function') {
        callback = eleOrId;
        eleOrId = this.getCanvas();
      }
      if (typeof callback == 'undefined') {
        callback = function () { };
      }
      this.onCanvasCallbackList.push(callback);
      var canvas = self.getEle(eleOrId);
      if (this.flip) {
        canvas.classList.add(this.id);
      }
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
                if (self.cnt++ == 30 /* skip 30 frame*/) {
                  for (var i = 0; i < self.onReadyCallbackList.length; i++) {
                    self.onReadyCallbackList[i]();
                  }
                }
                var ctx = canvas.getContext('2d');
                self.rotateImg(video, canvas, self.rotate, true);
                if (self.onCanvasCallbackList.length > 0) {
                  for (var i = 0; i < self.onCanvasCallbackList.length; i++) {
                    self.onCanvasCallbackList[i](self.canvas, video);
                  }
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
              for (var i = 0; i < self.onCanvasCallbackList.length; i++) {
                self.onCanvasCallbackList[i](self.canvas, video);
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
              if (self.onCanvasCallbackList.length > 0) {
                for (var i = 0; i < self.onCanvasCallbackList.length; i++) {
                  self.onCanvasCallbackList[i](self.canvas, video);
                }
              }
              requestAnimationFrame(loop);
            }
            requestAnimationFrame(loop);
            break;
          case videoStreamCam:
            var video = self.createVideo();
            console.log("start videoStream Cam");
            window.remoteVideo = self.video = video;
            var sourceMP4 = document.createElement("source");
            video.appendChild(sourceMP4);
            sourceMP4.type = "video/mp4";
            sourceMP4.src = self.URL;
            //
            video.onloadeddata = function () {
              var loop = function () {
                for (var i = 0; i < self.onReadyCallbackList.length; i++) {
                  self.onReadyCallbackList[i]();
                }
                var ctx = canvas.getContext('2d');
                self.rotateImg(video, canvas, self.rotate, true);
                if (self.onCanvasCallbackList.length > 0) {
                  for (var i = 0; i < self.onCanvasCallbackList.length; i++) {
                    self.onCanvasCallbackList[i](self.canvas, video);
                  }
                }
                requestAnimationFrame(loop);
              }
              requestAnimationFrame(loop);
            }
            video.autoplay = 'autoplay';
            video.muted = 'true';
            video.play();
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
      if (cw != ch && (cRatio != iRatio) && !this.autoScale && !isVideo) {
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
      if (this.camType != 0 && this.camType != jpgCam && this.camType != imgStreamCam && this.camType != videoStreamCam) {
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
      if (this.getImageFailure) {
        console.log("upload cancel...");
        return;
      }
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