import _ from 'lodash';
import moment from 'moment';

export default class Place {
  constructor(location, time) {
    this.position = location;
    this.startTime = time;
    this.attachments = [];
  }

  end(time) {
    this.endTime = time;
  }

  tickHere(time, dt) {

  }

  tickNotHere(time, dt) {

  }
}
