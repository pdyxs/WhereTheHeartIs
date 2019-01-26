import _ from 'lodash';
import moment from 'moment';

export default class Attachment {
  attachmentLevel = 1;

  constructor(position) {
    this.position = position;
    this.x = position[0];
    this.y = position[1];
    this.type = 'attachment';
  }

  tickHere(dt) {
  }

  tickNotHere(dt) {
  }
}
