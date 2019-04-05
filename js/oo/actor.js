/*
        var obj = new Actor({
            'stage': 'c1',
            'img': 'res/coin.png',
            'snd': 'res/coin.mp3',
            'pos': [100, 100, 25, 25]
        })
*/
class Actor {
    constructor(cv, info) {
        var self = this;
        self.cv = cv;
        self.info = info;
        self.img = null;
        self.stage = document.getElementById(info.stage);
        self.body = document.getElementsByTagName('body')[0];
        self.setImg(info.img, info.pos);
        self.audio = new Audio(info.snd);
        self.jsonInfo = {
            "history": 100,
            "varThreshold": 25,
            "learningRate": 0.001,
            "detectShadows": false,
            "objMinSize": 5,
            "filter": ["e3", "g1", "d3"]
        };
        self.setTracking({
            'inside': function (pos) {
                self.audio.play();
                self.hide();
            },
            'outside': function (pos) {
                //console.log("outside");
            }
        });
    }

    play() {
        this.audio.play();
        return this;
    }

    showTime() {
        this.tracking.scan();
    }

    setImg(url, pos) {
        var self = this;
        if (self.img != null) {
            self.body.removeChild(this.img);
        }
        self.img = new Image();
        self.img.onload = function () {
            this.style.position = 'absolute';
            this.style.left = self.stage.offsetLeft + pos[0] + 'px';
            this.style.top = self.stage.offsetTop + pos[1] + 'px';
            self.body.appendChild(this);
        };
        self.img.src = url;
        self.x = pos[0];
        self.y = pos[1];
        self.width = self.img.width;
        self.height = self.img.height;
        if (pos.length == 4) {
            self.width = this.info.pos[2];
            self.height = this.info.pos[3];
            self.img.style.width = self.width + 'px';
            self.img.style.height = self.height + 'px';
        }
        return this;
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
        this.img.style.left = this.stage.offsetLeft + this.x + "px";
        this.img.style.top = this.stage.offsetTop + this.y + "px";
        this.tracking.moveTo(x, y);
        return this;
    }

    hide() {
        this.img.style.display = 'none';
    }

    show() {
        this.img.style.display = '';
    }

    setTracking(callback) {
        var x = this.x;
        var y = this.y;
        this.tracking =
            new Hotspot(this.stage, this.stage, true,
                x, y,
                x + this.width, y,
                x + this.width, y + this.height,
                x, y + this.height);
        this.tracking.jsonInfo = this.jsonInfo;
        this.tracking.debug();
        this.tracking.setCvProcess(this.cv.imgFilter);

        if (typeof callback['inside'] == "function") {
            this.tracking.inside(callback['inside']);
        }
        if (typeof callback['outside'] == "function") {
            this.tracking.outside(callback['outside']);
        }
        return this;
    }

    start() {
        var self = this;
        setTimeout(function () {
            console.log("Actor start..");
            self.tracking.start();
        }, 1000);
    }

}