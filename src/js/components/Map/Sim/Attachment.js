import _ from 'lodash';
import moment from 'moment';
import { getRandomSVG } from '../svg';
import * as d3 from 'd3';
import axios from 'axios';

var cities = [];
var quadtree = null;
axios.get('/cities.json')
  .then(res => {
    cities = res.data;
    // quadtree = d3.quadtree(cities);
  });

var randomPlace = () => {
  return cities[_.random(cities.length)];
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
      moment.duration(Math.pow(_.random(1,4,true), 1.5),
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
          if (cities.length > 0)
          {
            this.position = randomPlace();
          }
          this.initTimeToNextTravel();
        }
      }
    }
  }
}
