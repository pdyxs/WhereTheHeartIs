import _ from 'lodash';
import moment from 'moment';
import Attachment from './Attachment';

const chanceToAddAttachment = 0.25;

export default class Place {
  constructor(location, time) {
    this.position = location;
    this.startTime = time;
    this.goodness = _.random(1, 3, true);
    this.setupTimeToNextAttachment();
  }

  setupTimeToNextAttachment() {
    this.timeToNextAttachment = Math.pow(_.random(this.goodness - 0.5, this.goodness + 0.5, true), 2);
  }

  end(time) {
    this.endTime = time;
  }

  tickHere(time, dt, rdt) {
    var created = [];
    this.timeToNextAttachment -= rdt/1000;
    if (this.timeToNextAttachment <= 0)
    {
      this.setupTimeToNextAttachment();
      var natt = new Attachment(this.position);
      created.push(natt);
    }
    return created;
  }

  tickNotHere(time, dt, rdt) {

  }
}
