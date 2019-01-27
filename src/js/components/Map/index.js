import React, { Component, Fragment } from "react";
import moment from 'moment';
import D3Map from './D3Map';
import {geolocated} from 'react-geolocated';
import {withRouter} from 'react-router-dom';

import Journey from './Sim/Journey';

import './Map.scss';

const dayMilliseconds = moment.duration(1, 'day').asMilliseconds();
const startRate = 1.5;
const rateChange = 0.25;
const maxRate = moment.duration(0.25, 'year').asDays();

class Map extends Component {
  constructor() {
    super();
    this.state = {
      time: 0,
      timeHere: 0
    };
  }

  componentDidMount() {
    this.journey = new Journey();
    var coords = this.props.location.state?.useCoords ?
      [this.props.location.state.longitude, this.props.location.state.latitude] :
      null;
    this.map = new D3Map(this._rootNode, this.journey, this.props, coords);

    this.firstUpdate = moment();
    this.lastUpdated = this.firstUpdate.valueOf();
    this.timerID = setInterval(
      () => this.tick(),
      30
    );
  }

  tick = () => {
    var now = moment().valueOf();
    var dt = now - this.lastUpdated;
    this.lastUpdated = now;

    var rate = Math.min(maxRate, startRate *
      (1 + moment.duration(this.journey.timeHere()).asDays()) * rateChange);
    var journeyDt = rate * dayMilliseconds * dt / 1000;
    this.journey.tick(journeyDt, dt);
    this.setState({
      time: this.journey.time,
      timeHere: this.journey.timeHere()
    });
  }

  componentDidUpdate(prevProps) {
    this.map.update(
       this._rootNode,
       this.props,
       prevProps
    );
  }

  componentWillUnmount() {
    this.map.destroy(this._rootNode);
    this.map = null;
    clearInterval(this.timerID);
  }

  _setRef = (componentNode) => {
    this._rootNode = componentNode;
  }

  humanize(time) {
    var duration = moment.duration(time);
    var humanized = duration.humanize();
    if (Math.round(duration.asHours()) < 1) {
      humanized = '0 hours';
    } else
    {
      var weeks = Math.round(duration.asWeeks());
      if (Math.round(duration.asDays()) >= 7 && duration.asMonths() < 1) {
        humanized = weeks == 1 ? 'a week' : `${weeks} weeks`;
      }
    }
    return humanized;
  }

  render() {
    return (
      <Fragment>
        <svg id="map"
          viewBox="-120 -120 240 240"
          ref={this._setRef.bind(this)} />
        <div id="timer">
          <p>You have been here for {this.humanize(this.state.timeHere)}</p>
          <p>You have been travelling for {this.humanize(this.state.time)}</p>
        </div>
      </Fragment>
    );
  }
}

export default withRouter(Map);
