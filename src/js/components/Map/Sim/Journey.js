import _ from 'lodash';
import moment from 'moment';

import Place from './Place';

class Journey {
  constructor() {
    this.current = null;
    this.past = [];
    this.time = 0;
  }

  goTo(location) {
    if (this.current)
    {
      this.current.end(this.time);
      this.past.push(this.current);
    }
    this.current = new Place(location, this.time);
  }

  currentStop() {
    return this.current ? [this.current] : [];
  }

  paths() {
    return _.map(this.past, (last, i) => {
      var next = i == this.past.length - 1 ? this.current : this.past[i+1];
      return [
        last.position,
        next.position
      ];
    }, this);
  }

  pastStops() {
    return this.past;
  }

  timeHere() {
    return this.current ? this.time - this.current.startTime : this.time;
  }

  tick (dt) {
    if (this.current == null) return;
    this.time += dt;
    this.current?.tickHere(this.time, dt);
    _.forEach(this.past, p => p.tickNotHere(dt));
  }
}

export default Journey;
