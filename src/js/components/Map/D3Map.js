import * as d3 from "d3";
import Victor from 'victor';

const D3Map = {};

import _ from 'lodash';

var currentAffectors = {};

function isTouchDevice(){
    return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}

D3Map.create = (el, props) => {
};

D3Map.update = (el, props, prevProps) => {
};

D3Map.destroy = () => {
    // Cleaning code here
};

export default D3Map;
