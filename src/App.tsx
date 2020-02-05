import React, { Component } from 'react';
import Navbar from 'react-bootstrap/Navbar';
import Nav from 'react-bootstrap/Nav';
import * as tf from '@tensorflow/tfjs';
import './App.css';
import { Tensor } from '@tensorflow/tfjs';


/**
 * A simple React App to for classifying recyclable garbage 
 *
 * @author iberatkaya
 */

interface Props {

};

interface State {
  image: string,
  scanned: boolean,
  loading: boolean,
  model: tf.LayersModel | null,
  pred: RecycleTypes | null
}

interface RecycleTypes {
  Cardboard: number,
  Glass: number,
  Metal: number,
  Paper: number,
  Plastic: number,
  Trash: number
}

class App extends Component<Props, State> {

  constructor(props: Props) {
    super(props);
    this.state = {
      image: '',
      scanned: false,
      model: null,
      loading: false,
      pred: null
    }
  }

  getBase64 = (file: File) => {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.persist();
    const file = e.target.files![0]
    const imagedata = await this.getBase64(file) as string;
    this.setState({ loading: true, image: imagedata })
  }

  render() {
    return (
      <div>
        <Navbar bg="info" variant="dark" expand="lg">
          <Navbar.Brand style={{ color: '#eee' }} href="/">Recycle Classification</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
              <Nav.Link style={{ color: '#eee' }} target="_blank" rel="noopener noreferrer" href="https://github.com/iberatkaya">GitHub</Nav.Link>
              <Nav.Link style={{ color: '#eee' }} target="_blank" rel="noopener noreferrer" href="https://linkedin.com/in/ibrahim-berat-kaya">LinkedIn</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Navbar>
        <div className="container">
          <div className="row">
            <div className="col-lg-12 text-center">
              <h2 className="m-3">Recycle Classification</h2>
            </div>
          </div>
        </div>
        <div>
          {!this.state.loading ?
            <div>{
              this.state.image === '' ?
                <div className="container justify-center align-items-center">
                  <div className="text-center">
                    <p className="lead" style={{ fontSize: '1.1rem' }}>Upload your image to classify it. Images are clasified with Tensorflow.js using a custom trained model.</p>
                  </div>
                  <form className="form">
                    <div className="input-group">
                      <div className="input-group-prepend">
                        <span className="input-group-text">Upload</span>
                      </div>
                      <div className="custom-file">
                        <input value={this.state.image} onChange={this.onChange} accept="image/*" type="file" className="custom-file-input" />
                        <label className="custom-file-label">Choose image</label>
                      </div>
                    </div>
                  </form>
                </div>
                :
                <div className="container-fluid">
                  <div className="row">
                    <div className="col-lg-12">
                      <div className="text-center">
                        <img alt="input" ref="image" style={{ maxWidth: '60%', marginBottom: '2rem' }} className="img-responsive" src={this.state.image}></img>
                      </div>
                      <ul className="list-group mb-4">
                        <li className="list-group-item disabled">CNN Predictions</li>
                        <li className="list-group-item">Cardboard - Probability: {(this.state.pred!.Cardboard * 100).toFixed(2)}%</li>
                        <li className="list-group-item">Glass - Probability: {(this.state.pred!.Glass * 100).toFixed(2)}%</li>
                        <li className="list-group-item">Metal - Probability: {(this.state.pred!.Metal * 100).toFixed(2)}%</li>
                        <li className="list-group-item">Paper - Probability: {(this.state.pred!.Paper * 100).toFixed(2)}%</li>
                        <li className="list-group-item">Plastic - Probability: {(this.state.pred!.Plastic * 100).toFixed(2)}%</li>
                        <li className="list-group-item">Trash - Probability: {(this.state.pred!.Trash * 100).toFixed(2)}%</li>
                      </ul>
                      <div className="text-center mb-2">
                        <button className="btn btn-outline-primary" onClick={async () => {
                          this.setState({ image: '', scanned: false })
                        }}>Classify New Image</button>
                      </div>
                    </div>
                  </div>
                </div>
            }
            </div>
            :
            <div className="container text-center">
              <div className="text-center">
                <img alt="input" ref="image" style={{ width: '40rem', height: '40rem', marginBottom: '2rem', display: 'none' }}
                  onLoad={async () => {
                    let { model } = this.state;
                    if (model === null)
                      model = await tf.loadLayersModel('https://raw.githubusercontent.com/iberatkaya/recyclemodel/master/model.json');
                    //@ts-ignore
                    const tensor = tf.browser.fromPixels(this.refs.image, 1);
                    let resized = tf.cast(tf.image.resizeBilinear(tensor, [120, 120]), 'float32');
                    const inputMax = tf.max(resized);
                    const inputMin = tf.min(resized);
                    const normalized = resized.sub(inputMin).div(inputMax.sub(inputMin));
                    const stack = tf.stack([normalized]);
                    const predtensor = model.predict(stack);
                    //@ts-ignore
                    const data = await predtensor.data();
                    const pred = { Cardboard: data[0], Glass: data[1], Metal: data[2], Paper: data[3], Plastic: data[4], Trash: data[5] } as RecycleTypes
                    tensor.dispose();
                    inputMax.dispose();
                    inputMin.dispose();
                    resized.dispose();
                    (predtensor as tf.Tensor3D).dispose();
                    stack.dispose();
                    this.setState({ loading: false, pred: pred, model })
                  }}
                  className="img-responsive" src={this.state.image}></img>
              </div>
              <div className="spinner-border text-danger mb-3" role="status"></div>
              <div className="lead">Scanning...</div>
            </div>
          }
        </div>
      </div>
    )
  }
}

export default App
