import React, { Component } from 'react';
import './App.css';

import { BrowserRouter as Router, Route} from "react-router-dom";
import axios from 'axios';

import Navigation1 from './components/General/Navigation1';
import Navigation2 from './components/General/Navigation2';
import Navigation from './components/General/Navigation'
import Home from './components/General/Home';
import Client from './components/Clients/Client'; 
import Employee from './components/Users/Employee';
import Poject from './components/Projects/Project';
import Track from './components/General/Track';

export default class App extends Component{

  constructor(props){
      super(props);
      this.state={
          islog:"no"
      }
  }

  componentDidMount(){
    axios.get('/user')
      .then(res => this.setState({islog:res.data}))
        //this.setState({islog:res.data})
  }

  componentDidUpdate(prevProps,prevState){
    if(true){
      axios.get('/user')
        .then(res => this.setState({islog:res.data}))
    }
  }
  render(){
    if(this.state.islog.name==='Admin'){
      return (
        <Router>
          <Navigation />
          <br/>
          <Route
            path='/'
            exact
            render={(props) => (
              <Home {...props} islog={this.state.islog} />
            )}
          />
          <Route path='/client' exact component={Client} />
          <Route path='/track' exact component={Track} />
          <Route path='/employee' exact component={Employee} />
          <Route path='/project' exact component={Poject} />
        </Router>
      );
    }
    else if(this.state.islog==='no'){
      return (
        <Router>
          <Navigation1 />
          <br/>
          <Route
            path='/'
            exact
            render={(props) => (
              <Home {...props} islog={this.state.islog} />
            )}
          />
        </Router>
      );
    }
    else{
      return (
        <Router>
          <Navigation2 user={this.state.islog} />
          <br/>
          <Route
            path='/'
            exact
            render={(props) => (
              <Home {...props} islog={this.state.islog} />
            )}
          />
        </Router>
      );
    }
  }
}

