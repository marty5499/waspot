class WebEye {
    constructor(canvasId, camSrc) {
        this.camId = canvasId;
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        if (this.canvas == null) {
            this.canvas = this.createCanvas(canvasId);
        }
        this.fps = 0;
        this.nowFps = 0;
        this.lastRenderTime = 0;
        this.renderSpendTime = 0;
        this.uploadURL = '/cam32/' + this.camId;
        this.hot = new HotBlock(this.canvasId);
        this.cam = this.createCamera(camSrc);
        this.setConfig({
            "history": 2500,
            "varThreshold": 150,
            "learningRate": 0.005,
            "detectShadows": false,
            "objMinSize": 10,
            "lineWidth": 3,
            "strokeStyle": '#FF0000',
            "filter": ["e3", "g3", "d2"]
        });
    }

    setConfig(info) {
        this.info = info;
    }

    addHotArea(area) {
        var self = this;
        this.info['id'] = "id_" + Math.random();
        this.info['area'] = area;
        this.hot.addBlock(this.info, {
            inside: function (pos, c) {
                var ctx = c.getContext("2d");
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, pos.radius * 2, 0, 2 * Math.PI);
                ctx.stroke();
                this.setStroke(2, "#00FF00");
                console.log("detect:", new Date().toLocaleTimeString());
                self.cam.upload(self.uploadURL + '?time');
            },
            outside: function (pos) {
                this.setStroke(2, "#FF0000");
            }
        });
    }

    setUploadURL(uploadURL) {
        this.uploadURL = uploadURL + "/cam32/" + this.camId;
    }

    createCanvas(id) {
        var canvas = document.createElement('canvas');
        canvas.id = id;
        canvas.width = 320;
        canvas.height = 240;
        var body = document.getElementsByTagName("body")[0];
        body.appendChild(canvas);
        return canvas;
    }

    createCamera(camSrc) {
        var self = this;
        var cam = new Camera(camSrc);
        cam.setAutoScale(true);
        cam.onCanvas(this.canvas, function (canvas) {
            var now = new Date().getTime();
            self.renderSpendTime = now - self.lastRenderTime;
            self.fps = self.lastRenderTime == 0 ? 0 : 1000.0 / self.renderSpendTime;
            self.lastRenderTime = now;
            //showFPS(canvas.getContext('2d'));
            self.hot.scan();
        });
        return cam;
    }

    start() {
        this.hot.startAfter(1000);
    }
}