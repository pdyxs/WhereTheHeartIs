import React, { Component } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import {geolocated} from 'react-geolocated';
import { Link } from 'react-router-dom';

library.add(faHeart);

class Home extends Component {
  render() {
    var hasGeolocation =
      this.props.isGeolocationAvailable &&
      this.props.isGeolocationEnabled &&
      this.props.coords &&
      this.props.coords.latitude &&
      this.props.coords.longitude;
    var coords = this.props.coords;
    return (
      <div className="container">
        <div className="jumbotron mb-1">
          <div className="float-right heart">
            <FontAwesomeIcon icon={['fas', 'heart']} />
          </div>
          <h1 className="display-4">Where the Heart Is</h1>
          <p className="lead">A reflection on globalised life</p>
        </div>
        <div>
          <div className="text-right">
            Made by <a href="https://pdyxs.wtf" target="_blank">PDYXS</a> for <a href="https://globalgamejam.org/" target="_blank">Global Game Jam 2019</a>
          </div>
        </div>
        <div className="text-center mt-4">
          <Link role="button"
            className="btn btn-lg btn-primary mx-2"
            to={{
              pathname: "/map",
              state: {
                useCoords: true,
                longitude: coords?.longitude,
                latitude: coords?.latitude
              }
            }}
            disabled={!hasGeolocation}
            data-toggle="tooltip" data-placement="top" title="Tooltip on top">
            Begin at your location
          </Link>
          <Link role="button" className="btn btn-lg btn-primary mx-2"
            to={{
              pathname: "/map",
              state: {useCoords: false}
            }}>
            Choose where to begin
          </Link>
        </div>
      </div>
    );
  }
}

export default geolocated()(Home);
