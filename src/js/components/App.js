import React, { Component } from "react";
import './App.scss';
import { connect } from 'react-redux';
import moment from 'moment';
import Map from './Map';

class App extends Component {
  render() {
      return (
        <div>
          <Map />
        </div>
      );
  }
}

export default App;
