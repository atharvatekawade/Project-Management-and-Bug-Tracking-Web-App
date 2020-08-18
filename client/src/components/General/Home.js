import 'bootstrap/dist/css/bootstrap.min.css';
import React, { Component } from 'react';
import{ useState, useEffect } from 'react';
import {
  withGoogleMap,
  withScriptjs,
  GoogleMap,
  Marker,
  InfoWindow
} from "react-google-maps";

import Notification from './Notification';
import Notification1 from './Notification1';
import Footer from './Footer';

function Map() {
    const [selectedPark, setSelectedPark] = useState(null);
  
    return (
      <GoogleMap
        defaultZoom={4.5}
        defaultCenter={{lat:22.4,lng:78.85}}
        //defaultCenter={{lat: 40.774102, lng: -73.971734}}
        
      >
        
        <Marker
          
          position={{lat:18.5204,lng:73.8567}}
          onClick={() => {
            setSelectedPark("Pune");
          }}
          >
          {selectedPark==="Pune" && (
            <InfoWindow
              
              onCloseClick={() => {
                setSelectedPark(false);
              }}
            >
              <div>
                <h6 id='dd'>Pune Branch</h6>
              </div>
            </InfoWindow>
          )}
  
        </Marker>
        <Marker
          
          position={{lat:13.05,lng:77.5946}}
          onClick={() => {
            setSelectedPark("Banglore");
          }}
          >
          {selectedPark==="Banglore" && (
            <InfoWindow
              
              onCloseClick={() => {
                setSelectedPark(false);
              }}
            >
              <div>
                <h6 id='dd'>Banglore Branch</h6>
              </div>
            </InfoWindow>
          )}
  
        </Marker>
        <Marker
          
          position={{lat:17.3850,lng:78.4867}}
          onClick={() => {
            setSelectedPark("Hyd");
          }}
          >
          {selectedPark==="Hyd" && (
            <InfoWindow
              
              onCloseClick={() => {
                setSelectedPark(false);
              }}
            >
              <div>
                <h6 id='dd'>Hyderabad Branch</h6>
              </div>
            </InfoWindow>
          )}
  
        </Marker>
        <Marker
          
          position={{lat:28.4595,lng:77.0266}}
          onClick={() => {
            setSelectedPark("Del");
          }}
          >
          {selectedPark==="Del" && (
            <InfoWindow
              
              onCloseClick={() => {
                setSelectedPark(false);
              }}
            >
              <div>
                <h6 id='dd'>Gurgaon Branch</h6>
              </div>
            </InfoWindow>
          )}
  
        </Marker>
  
        
      </GoogleMap>
    );
}

const MapWrapped = withScriptjs(withGoogleMap(Map));
let url="https://maps.googleapis.com/maps/api/js?v=3.exp&libraries=geometry,drawing,places&key=AIzaSyDyhZOEsdviYHehMLdhKLdiXbeHhGLQ6vg";
let route="https://maps.googleapis.com/maps/api/js?key=AIzaSyDyhZOEsdviYHehMLdhKLdiXbeHhGLQ6vg&callback=initMap";


export default class Home extends Component{
    constructor(props){
        super(props);
    }
    render(){
        return (
            <div>
                <h1 className='heading'>Welcome to Aplha Infotech</h1>
                
                    <div class='row'>
                        {this.props.islog!=='no' && this.props.islog.name==='Admin' &&
                        <div class='col-sm-2 ml-4'>
                            <Notification />
                        </div>
                        }
                        {this.props.islog!=='no' && this.props.islog.name!=='Admin' &&
                        <div class='col-sm-2 ml-4'>
                            <Notification1 user={this.props.islog} />
                        </div>
                        }
                        <div className='container'>
                          {this.props.islog!=='no' &&
                            <div class='col-sm-10'>
                              <p className='mt-3 content'>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy.</p>
                              <p className='content'>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable.</p>
                              <br />
                              <hr className='mb-5' />
                              <h4 className='mt-2 mb-4' style={{textAlign:'center',fontFamily:'Georgia'}}>Our Braches across India</h4>
                              <div style={{ width: "42%", height: "540px", borderRadius:"12px", overflow: 'hidden', marginLeft:"30%",zIndex:"99999"}} className='container'>
                                  <MapWrapped
                                  googleMapURL={url}
                                  loadingElement={<div style={{ height: `100%` }} />}
                                  containerElement={<div style={{ height: `100%` }} />}
                                  mapElement={<div style={{ height: `100%` }} />}
                                  id='map'
                                  />
                              </div>
                            </div>
                          }
                          {this.props.islog==='no' &&
                            <div>
                              <p className='mt-3 content'>It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English. Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy.</p>
                              <p className='content'>There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable. If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text. All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet. It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable.</p>
                              <br />
                              <hr className='mb-5' />
                              <h4 className='mt-2 mb-4' style={{textAlign:'center',fontFamily:'Georgia'}}>Our Braches across India</h4>
                              <div style={{ width: "42%", height: "540px", borderRadius:"12px", overflow: 'hidden', marginLeft:"30%",zIndex:"99999"}} className='container'>
                                  <MapWrapped
                                  googleMapURL={url}
                                  loadingElement={<div style={{ height: `100%` }} />}
                                  containerElement={<div style={{ height: `100%` }} />}
                                  mapElement={<div style={{ height: `100%` }} />}
                                  id='map'
                                  />
                              </div>
                            </div>
                          }
                        </div>
                    </div>
                
                <br />
                <br />
                <br />
                <Footer className='mt-4' />
            </div>
        );
    }
}