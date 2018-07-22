import * as tf from '@tensorflow/tfjs';
import { ControllerDataset } from './controller_dataset';


export class ImageDL {

  constructor(num_classes) {
    this.NUM_CLASSES = num_classes;
    this.controllerDataset = new ControllerDataset(num_classes);
    this.httpSavePath = window.location.protocol + '//' + window.location.host + "/";
  }

  // Loads mobilenet and returns a model that returns the internal activation
  // we'll use as input to our classifier model.
  async loadMobilenet() {
    let mobilenet = await tf.loadModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_0.25_224/model.json');
    //let mobilenet = await tf.loadFrozenModel(MODEL_URL, WEIGHTS_URL);
    // Return a model that outputs an internal activation.
    const layer = mobilenet.getLayer('conv_pw_13_relu');
    return tf.model({ inputs: mobilenet.inputs, outputs: layer.output });
  }

  setServer(url) {
    this.httpSavePath = url;
  }

  addExample(img, label) {
    let example = tf.tidy(() => {
      const webcamImage = tf.fromPixels(img);
      const croppedImage = this.cropImage(webcamImage);
      const batchedImage = croppedImage.expandDims(0);
      return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
    });
    this.controllerDataset.addExample(this.mobilenet.predict(example), label);
  }

  cropImage(img) {
    const size = Math.min(img.shape[0], img.shape[1]);
    const centerHeight = img.shape[0] / 2;
    const beginHeight = centerHeight - (size / 2);
    const centerWidth = img.shape[1] / 2;
    const beginWidth = centerWidth - (size / 2);
    return img.slice([beginHeight, beginWidth, 0], [size, size, 3]);
  }


  async train(callback) {
    var self = this;
    self.msg = "";
    //model = await tf.loadModel('indexeddb://my-model');
    //return;

    // Creates a 2-layer fully connected model. By creating a separate model,
    // rather than adding layers to the mobilenet model, we "freeze" the weights
    // of the mobilenet model, and only train weights from the new model.
    this.model = tf.sequential({
      layers: [
        // Flattens the input to a vector so we can use it in a dense layer. While
        // technically a layer, this only performs a reshape (and has no training
        // parameters).
        tf.layers.flatten({ inputShape: [7, 7, 256] }),
        // Layer 1
        tf.layers.dense({
          units: 100 /*ui.getDenseUnits()*/ ,
          activation: 'relu',
          kernelInitializer: 'varianceScaling',
          useBias: true
        }),
        // Layer 2. The number of units of the last layer should correspond
        // to the number of classes we want to predict.
        tf.layers.dense({
          units: this.NUM_CLASSES,
          kernelInitializer: 'varianceScaling',
          useBias: false,
          activation: 'softmax'
        })
      ]
    });

    // Creates the optimizers which drives training of the model.
    const optimizer = tf.train.adam(0.0001 /*ui.getLearningRate()*/ );
    // We use categoricalCrossentropy which is the loss function we use for
    // categorical classification which measures the error between our predicted
    // probability distribution over classes (probability that an input is of each
    // class), versus the label (100% probability in the true class)>
    this.model.compile({ optimizer: optimizer, loss: 'categoricalCrossentropy' });

    // We parameterize batch size as a fraction of the entire dataset because the
    // number of examples that are collected depends on how many examples the user
    // collects. This allows us to have a flexible batch size.
    const batchSize =
      Math.floor(this.controllerDataset.xs.shape[0] * 0.2 /*ui.getBatchSizeFraction()*/ );
    if (!(batchSize > 0)) {
      throw new Error(
        `Batch size is 0 or NaN. Please choose a non-zero fraction.`);
    }

    // Train the model! Model.fit() will shuffle xs & ys so we don't have to.
    this.model.fit(this.controllerDataset.xs, this.controllerDataset.ys, {
      batchSize,
      epochs: 40 /* def:20 , ui.getEpochs()*/ ,
      callbacks: {
        onBatchEnd: async function (batch, logs) {
          var msg = 'Loss: ' + logs.loss.toFixed(5);
          self.msg = msg;
          window.setMsg(msg);
          await tf.nextFrame();
        },
        onTrainEnd: async function () {
          console.log("onTrainEnd.");
          //const model = tf.sequential({ layers: [tf.layers.dense({ units: 1, inputShape: [3] })] });
          //const saveResults = await self.model.save('indexeddb://my-model');
          var modelName = 'model-' + new Date().getTime();
          try {
            var postPath = self.httpSavePath + 'upload/' + modelName;
            const saveResults = await self.model.save(postPath);
            var saveURL = saveResults.responses[0].url;
            saveURL = saveURL.replace('upload', 'download');
            saveURL += "/model.json";
            console.log("saveResults:", saveResults);
            window.setMsg("訓練完成，下載模型網址<br><a href='" + saveURL + "'>" + saveURL + "</a>");
          } catch (e) {
            console.log("file upload error:", e);
            window.setMsg("錯誤：" + e);
          }
          callback();
        }
      }
    });
  }


  async predict(chkImg, callback) {
    const predictedClass = tf.tidy(() => {
      // Capture the frame from the webcam.
      const img = tf.tidy(() => {
        const webcamImage = tf.fromPixels(chkImg);
        const croppedImage = this.cropImage(webcamImage);
        const batchedImage = croppedImage.expandDims(0);
        return batchedImage.toFloat().div(tf.scalar(127)).sub(tf.scalar(1));
      });
      // Make a prediction through mobilenet, getting the internal activation of
      // the mobilenet model.
      const activation = this.mobilenet.predict(img);
      // Make a prediction through our newly-trained model using the activation
      // from mobilenet as input.
      const predictions = this.model.predict(activation);
      // Returns the index with the maximum probability. This number corresponds
      // to the class the model thinks is the most probable given the input.
      return predictions;
    });
    window.pp = predictedClass;
    // 最高的信心種類
    const classId = (await predictedClass.as1D().argMax().data())[0];
    // 每個種類的信心度
    var confidence = +predictedClass.dataSync()[classId];
    predictedClass.as1D().argMax().dispose();
    callback(classId, confidence);
  }


  async load(url, callback) {
    console.log("mobilenet init...");
    this.mobilenet = await this.loadMobilenet();
    console.log("mobilenet init...OK");
    if (arguments.length > 0) {
      this.model = await tf.loadModel(url);
      console.log("load model OK");
      callback();
    }
  }

}

window.ImageDL = ImageDL;
