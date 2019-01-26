import _ from 'lodash';

export function initState(name) {
  return (initialState) => {
    return _.mapValues(initialState, (val, key) => {
      var item = localStorage.getItem(`${name}/${key}`);
      if (item) return JSON.parse(item);
      return val;
    });
  };
}

export function saveState(name) {
  return (state) => {
    _.forEach(state, (val, key) => {
      localStorage.setItem(`${name}/${key}`, JSON.stringify(val));
    });
    return state;
  }
}
