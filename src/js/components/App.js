import React, { Component } from "react";
import './App.scss';
import { connect } from 'react-redux';
import moment from 'moment';
import { Switch, Route } from 'react-router-dom';
import Map from './Map';
import Home from './Home';

class App extends Component {
  render() {
      return (
        <Switch>
          <Route path="/map">
            <div className="map-container">
              <Map />
            </div>
          </Route>
          <Route path="/" component={Home} />
        </Switch>
      );
  }
}

export default App;
