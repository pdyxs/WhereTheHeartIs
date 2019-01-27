import _ from 'lodash';
import moment from 'moment';
import { getRandomSVG } from '../svg';

const amounts = {
  people: 20,
  places: 5,
  animals: 3
};

export default class Attachment {
  attachmentLevel = 1;
  static libraries = [];

  constructor(position) {
    this.position = position;
    this.x = position[0];
    this.y = position[1];
    this.image = 'circle';
    this.size = 2;
    this.order = 2;

    if (Attachment.libraries.length == 0) {
      Attachment.libraries = _.shuffle(
        _.reduce(amounts, (acc, v, key) => {
          return [...acc, ..._.times(v, _.constant(key))];
        }, [])
      );
    }
    this.library = Attachment.libraries[0];
    Attachment.libraries = _.drop(Attachment.libraries);
    this.type = `attachment-${this.library}`;

    this.svg = getRandomSVG(this.library);
  }

  tickHere(dt) {
  }

  tickNotHere(dt) {
  }
}
