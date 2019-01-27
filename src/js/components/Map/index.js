import React, { Component, Fragment } from "react";
import moment from 'moment';
import D3Map from './D3Map';
import {geolocated} from 'react-geolocated';
import {withRouter, Link} from 'react-router-dom';

import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';

library.add(faChevronUp);
library.add(faChevronDown);

import Journey from './Sim/Journey';

import './Map.scss';

const dayMilliseconds = moment.duration(1, 'day').asMilliseconds();
const startRate = 1.5;
const rateChange = 0.25;
const maxRate = moment.duration(0.25, 'year').asDays();

function isTouchDevice(){
    return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}

class Map extends Component {
  constructor() {
    super();
    this.state = {
      time: 0,
      timeHere: 0,
      expanded: true,
      running: true
    };
  }

  componentDidMount() {
    this.journey = new Journey();
    var coords = this.props.location.state?.longitude ?
      [this.props.location.state.longitude, this.props.location.state.latitude] :
      null;
    var useCoords = this.props.location.state?.useCoords;
    this.map = new D3Map(this._rootNode, this.journey, this.props, coords, useCoords);

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
    } else {
      var weeks = Math.round(duration.asWeeks());
      if (Math.round(duration.asDays()) >= 7 && duration.asMonths() < 1) {
        humanized = weeks == 1 ? 'a week' : `${weeks} weeks`;
      }
    }
    return humanized;
  }

  toggleExpanded = () => {
    this.setState({
      expanded: !this.state.expanded
    });
  }

  end = () => {
    clearInterval(this.timerID);
    this.map.end();
    this.setState({
      running: false
    });
  }

  render() {
    return (
      <Fragment>
        <svg id="map"
          viewBox="-120 -120 240 240"
          ref={this._setRef.bind(this)} />
        <div id="timer" className="card text-light bg-secondary">
          <div className="card-header lead">
            <a className="float-right ml-3"
                onClick={this.toggleExpanded}>
              <FontAwesomeIcon
                icon={['fas', `chevron-${this.state.expanded ? 'up' : 'down'}`]} />
            </a>
            Your Journey
          </div>
          {this.state.expanded &&
            <div className="card-body">
              {this.journey?.current ?
                <Fragment>
                  <dl className="row">
                    <dt className="col-8 text-right">You have visited</dt>
                    <dd className="col-4">{this.journey.past.length + 1} place{this.journey.past.length > 0 && 's'}</dd>

                    <dt className="col-8 text-right">over</dt>
                    <dd className="col-4 mb-4">{this.humanize(this.state.time)}</dd>

                    <dt className="col-8 text-right">You have stayed here for</dt>
                    <dd className="col-4">{this.humanize(this.state.timeHere)}</dd>
                  </dl>
                  {this.state.running &&
                    <div className="text-right">
                      <button className="btn btn-info text-right"
                        onClick={this.end}>
                        End your journey
                      </button>
                    </div>
                  }
                </Fragment>
               :
                <Fragment>
                  <p>{isTouchDevice() ? 'Tap' : 'Click'} on a place to begin</p>
                </Fragment>
             }
            </div>
          }
        </div>
        <div className="fixed-bottom text-secondary mx-2 my-2">
          <div className="container">
            <div className="float-right">
              <Link to="/">Return to Homepage</Link>
            </div>
            <em>Where the Heart is</em> by <a href="https://pdyxs.wtf">PDYXS</a>
          </div>
        </div>
      </Fragment>
    );
  }
}

export default withRouter(Map);
