import { KNNImageClassifier } from 'deeplearn-knn-image-classifier';
import * as dl from 'deeplearn';

// Number of classes to classify
let NUM_CLASSES = 4;
// Webcam Image size. Must be 227. 
let IMAGE_SIZE = 227;
// K value for KNN
let TOPK = 10;


class ImgClassifier {

  constructor(canvas, jsonData) {
    this.imageMap = jsonData;
    NUM_CLASSES = Object.keys(jsonData).length;
    this.knn = new KNNImageClassifier(NUM_CLASSES, TOPK);
    this.ds = new DataSource(canvas, dl, this.knn);
    this.ds.setSize(IMAGE_SIZE, IMAGE_SIZE);
    this.knn.load().then(() => this.start());
    this.isTraining = true;
    this.onLoadCallback = function(msg) {
      console.log(msg);
    };
    window.ds = this.ds;
  }

  start() {
    var idx = 0;
    var self = this;
    self.onLoadCallback("ImgClassifier start...");
    this.load(idx, this.imageMap, function() {
      self.onLoadCallback("load OK");
      self.isTraining = false;
    });
  }

  onLoad(cb) {
    console.log("set onLoad...");
    this.onLoadCallback = cb;
  }

  load(idx, jsonData, cbDone) {
    var self = this;
    var key = Object.keys(jsonData)[idx];
    if (key == undefined) {
      cbDone();
      return;
    }
    var url = jsonData[idx];
    self.onLoadCallback('加入影像物件識別:' + url['name']);
    self.ds.loadImageClass(key, url, function() {
      self.load(idx + 1, jsonData, cbDone);
    });
  }

  stop() {}

  check(canvas, result) {
    var self = this;
    if (self.isTraining) {
      return;
    }
    const image = dl.fromPixels(canvas);
    this.knn.predictClass(image)
      .then((res) => {
        var i = res.classIndex;
        var name = self.imageMap[i]['name'];
        result(name, res.confidences[i]);
        image.dispose();
      });
  }

  onDetect(cbDetect, midTime) {
    var self = this;
    setInterval(function() {
      self.check(canvas, cbDetect);
    }, midTime);
  }
}

class Training {

  constructor(canvas) {
    // Initiate variables
    this.infoTexts = [];
    this.training = -1; // -1 when no class is being trained

    // Initiate deeplearn.js math and knn classifier objects
    this.knn = new KNNImageClassifier(NUM_CLASSES, TOPK);

    //create DataSource
    this.ds = new DataSource(canvas, dl, this.knn);
    window.ds = this.ds;


    // Create video element that will contain the webcam image
    //this.video = document.createElement('video');
    this.ds.setSize(IMAGE_SIZE, IMAGE_SIZE);
    // Create training buttons and info texts    
    for (let i = 0; i < NUM_CLASSES; i++) {
      const div = document.createElement('div');
      document.body.appendChild(div);
      div.style.marginBottom = '10px';

      // Create training button
      const button = document.createElement('button')
      button.innerText = "Train " + i;
      div.appendChild(button);

      // Listen for mouse events when clicking the button
      button.addEventListener('mousedown', () => this.training = i);
      button.addEventListener('mouseup', () => this.training = -1);


      // Create training button
      const exportBtn = document.createElement('button')
      exportBtn.innerText = "export jsonFile";
      exportBtn.style.backgroundColor = 'green';
      var content = document.createTextNode(" ");
      div.appendChild(content);
      div.appendChild(exportBtn);
      exportBtn.addEventListener('mousedown', function() {
        console.log("export ", i);
        var txt = ds.exportToJsonFile(i);
        ta.value = txt;
        console.log("export done , size:", txt.length);
      });

      // Create info text
      const infoText = document.createElement('span')
      infoText.innerText = " No examples added";
      div.appendChild(infoText);
      this.infoTexts.push(infoText);
      //
    }

    // Load knn model
    this.knn.load()
      .then(() => this.start());
  }

  start() {
    if (this.timer) {
      this.stop();
    }
    this.ds.play();
    this.timer = requestAnimationFrame(this.animate.bind(this));
  }

  stop() {
    this.ds.pause();
    cancelAnimationFrame(this.timer);
  }

  animate() {
    // Get image data from video element
    const image = dl.fromPixels(this.ds.getObj());
    // Train class if one of the buttons is held down
    if (this.training != -1) {
      // Add current image to classifier
      this.knn.addImage(image, this.training);
      this.ds.put(this.training);
    }
    // If any examples have been added, run predict
    const exampleCount = this.knn.getClassExampleCount();
    if (Math.max(...exampleCount) > 0) {
      this.knn.predictClass(image)
        .then((res) => {
          for (let i = 0; i < NUM_CLASSES; i++) {
            // Make the predicted class bold
            if (res.classIndex == i) {
              this.infoTexts[i].style.fontWeight = 'bold';
            } else {
              this.infoTexts[i].style.fontWeight = 'normal';
            }
            // Update info text
            if (exampleCount[i] > 0) {
              this.infoTexts[i].innerText = ` ${exampleCount[i]} examples - ${res.confidences[i]*100}%`
            }
          }
        })
        // Dispose image when done
        .then(() => image.dispose())
    } else {
      image.dispose()
    }
    this.timer = requestAnimationFrame(this.animate.bind(this));
  }
}




class DataSource {

  constructor(ele, dl, knn) {
    this.map = {};
    this.ele = ele;
    this.dl = dl;
    this.knn = knn;
  }

  setSize(width, height) {
    this.ele.width = width;
    this.ele.height = height;
  }

  getObj() {
    return this.ele;
  }

  play() {
    //for video tag
  }
  pause() {
    //for video tag
  }

  put(key) {
    if (!this.map.hasOwnProperty(key)) {
      this.map[key] = [];
    }
    var imgData = this.ele.toDataURL("image/png");
    this.map[key].push(imgData);
    console.log("save image: key:", key, " ,len:", imgData.length);
  }

  toJSON() {
    console.log(JSON.stringify(this.map));
  }

  loadImageClass(key, url, cbDone) {
    var self = this;
    console.log("load training data...key:", key, " , url=", url);
    //drawImageList(key, imgList, canvas, cbDone)
    $.getJSON(url, function (json) {
      self.drawImageList(key, json, self.getObj(), function () {
        console.log(key, " load done.");
        cbDone(key, url);
      });
    });
  }

  loadAll() {
    var self = this;
    console.log("load training data...");
    $.getJSON("trainingData.json", function (json) {
      self.drawAll(json, function () {
        console.log("import training Data completed.");
      });
    });
  }

  drawAll(jsonData, cbDone) {
    var self = this;
    var key = Object.keys(jsonData)[0];
    if (key == undefined) {
      cbDone();
      return;
    }
    if (self.map[key] == undefined) {
      self.map[key] = [];
    }
    var imgList = jsonData[key];
    self.map[key] = [];
    console.log("load Key:", key);
    self.drawImageList(key, imgList, self.getObj(), function () {
      delete jsonData[key];
      self.drawAll(jsonData, cbDone);
    });
  }

  drawImageList(key, imgList, canvas, cbDone) {
    var self = this;
    var img = new window.Image();
    var strDataURI = imgList.pop();
    if (strDataURI == undefined) {
      cbDone();
      return;
    }
    if (self.map[key] == undefined) {
      self.map[key] = [];
    }
    self.map[key].push(strDataURI);
    img.addEventListener("load", function () {
      canvas.getContext("2d").drawImage(img, 0, 0);
      const image = self.dl.fromPixels(canvas);
      self.knn.addImage(image, key);
      image.dispose();
      console.log(".");
      self.drawImageList(key, imgList, canvas, cbDone);
    });
    img.setAttribute("src", strDataURI);
  }

  exportToJsonFile(key) {
    let dataStr = JSON.stringify(this.map[key]);
    /* Maxinum Size: 2MB
    let dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    let exportFileDefaultName = 'data.json';
    let linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    //*/
    return dataStr;
  }

  info() {
    console.log(this.map.length);
  }
}

window.ImgClassifier = ImgClassifier;
window.Training = Training;