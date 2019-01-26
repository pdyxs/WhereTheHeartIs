import _ from 'lodash';
import moment from 'moment';
import Attachment from './Attachment';

const chanceToAddAttachment = 0.25;

export default class Place {
  constructor(location, time) {
    this.position = location;
    this.startTime = time;
    this.attachmentAmount = 0;
  }

  end(time) {
    this.endTime = time;
  }

  tickHere(time, dt, rdt) {
    var created = [];
    this.attachmentAmount += rdt/1000 * Math.random() * chanceToAddAttachment * 2;
    if (this.attachmentAmount > 0.5)
    {
      this.attachmentAmount = 0;
      var natt = new Attachment(this.position);
      created.push(natt);
    }
    return created;
  }

  tickNotHere(time, dt, rdt) {

  }
}
