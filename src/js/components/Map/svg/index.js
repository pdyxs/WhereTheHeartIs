import circle from './circle.svg';
import heart from './heart.svg';
import user from './user.svg';
import comment from './comment-alt.svg';

const images = {
  circle,
  heart,
  user,
  comment
};

const createSVG = (parent, name) => {
  var range = document.createRange();
  var documentFragment = range.createContextualFragment(images[name]);
  return parent.node().appendChild(documentFragment);
}

export default createSVG;
