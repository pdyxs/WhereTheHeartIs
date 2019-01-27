import circle from './circle.svg';
import heart from './heart.svg';
import user from './user.svg';
import comment from './comment-alt.svg';
import places from './places';
import people from './people';
import animals from './animals';
import _ from 'lodash';

const images = {
  circle,
  heart,
  user,
  comment
};

const libraries = {
  places,
  people,
  animals
};

const getRandomSVG = (libraryName) => {
  var library = libraries[libraryName];
  return library[_.random(library.length)];
}

const attachSVG = (parent, svg) => {
  var range = document.createRange();
  var documentFragment = range.createContextualFragment(svg);
  var ret = documentFragment.firstElementChild;
  (_.isFunction(parent.node) ? parent.node() : parent).appendChild(documentFragment);
  return ret;
}

const attachNamedSVG = (parent, name) => {
  return attachSVG(parent, images[name]);
}

const attachRandomSVGfromLibrary = (parent, libraryName) => {
  return attachSVG(parent, getRandomSVG(libraryName));
}

export {
  attachSVG,
  getRandomSVG,
  attachNamedSVG,
  attachRandomSVGfromLibrary
};
