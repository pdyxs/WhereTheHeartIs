import _ from 'lodash';
import moment from 'moment';
import { getRandomSVG } from '../svg';
import cities from 'cities.json';
import * as d3 from 'd3';

const quadtree = d3.quadtree(_.map(cities, c => [c.lng, c.lat]));

var randomPlace = () => {
  if (Math.random() > 0.2) {
    var city = cities[_.random(cities.length)];
    return [city.lng, city.lat];
  } else {
    var point = [_.random(-180,180,true), _.random(-90,90,true)];
    return quadtree.find(point[0], point[1]);
  }
}

const amounts = {
  people: 20,
  places: 5,
  animals: 3
};

const potentialDurations = [
  'days',
  'weeks',
  'months',
  'months',
  'months',
  'years',
  'years',
  'years',
  'years',
  'years'
]

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
    this.canTravel = this.library == 'people';
    this.svg = getRandomSVG(this.library);
  }

  initTimeToNextTravel() {
    this.timeToNextTravel =
      moment.duration(Math.pow(_.random(1,4,true), 2),
                      potentialDurations[_.random(potentialDurations.length)]
                    ).valueOf();
  }

  tick(cpos, dt, rdt) {
    if (this.canTravel) {
      if (_.isUndefined(this.timeToNextTravel)) {
        this.initTimeToNextTravel();
      } else {
        this.timeToNextTravel -= dt;
        if (this.timeToNextTravel <= 0) {
          this.position = randomPlace();
          this.initTimeToNextTravel();
        }
      }
    }
  }
}
