import React, { Component } from 'react';
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart } from '@fortawesome/free-solid-svg-icons';
import {geolocated} from 'react-geolocated';
import { Link } from 'react-router-dom';

library.add(faHeart);

class Home extends Component {
  handleClick = (e) => {
    if (!this.hasGeolocation())
      e.preventDefault();
  }

  hasGeolocation = () => {
    return this.props.isGeolocationAvailable &&
      this.props.isGeolocationEnabled &&
      this.props.coords &&
      this.props.coords.latitude &&
      this.props.coords.longitude;
  }

  render() {
    console.log(this.props);
    var hasGeolocation = this.hasGeolocation();

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
        <div className="text-center my-4">
          <Link role="button"
            className={`btn btn-lg btn-primary mx-2 ${hasGeolocation ? '' : 'disabled'}`}
            to={{
              pathname: "/map",
              state: {
                useCoords: true,
                longitude: coords?.longitude,
                latitude: coords?.latitude
              }
            }}
            onClick={this.handleClick}>
            Begin at your location
          </Link>
          <Link role="button" className="btn btn-lg btn-primary mx-2 my-2"
            to={{
              pathname: "/map",
              state: {
                useCoords: false,
                longitude: coords?.longitude,
                latitude: coords?.latitude
              }
            }}>
            Choose where to begin
          </Link>
        </div>
        <div>
          <p className="lead">This is an open-source project.
            You can get the source code <a href="https://github.com/pdyxs/WhereTheHeartIs">here</a>.</p>
        </div>
        <div>
          <h4>Things I used:</h4>
          <dl className="row">
            <dt className="col-3">Icons from</dt>
            <dd className="col-9">
              <a href="https://fontawesome.com" target="_blank">FontAwesome</a>
            </dd>

            <dt className="col-3">Emoji from</dt>
            <dd className="col-9">
              <a href="https://twemoji.twitter.com/" target="_blank">Twemoji</a>
            </dd>

            <dt className="col-3">Map data from</dt>
            <dd className="col-9">
              <a href="http://naturalearthdata.com/" target="_blank">Natural Earth</a>
              , courtesy of <a href="https://geojson-maps.ash.ms/" target="_blank">Ash Kyd</a>
            </dd>
          </dl>
        </div>
      </div>
    );
  }
}

export default geolocated()(Home);
