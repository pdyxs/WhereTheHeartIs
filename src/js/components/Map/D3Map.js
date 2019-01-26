import * as d3 from "d3";
import topojson from 'topojson';
import Victor from 'victor';
import axios from 'axios';

import _ from 'lodash';

function isTouchDevice(){
    return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}

const globeSize = 99;
const countriesSize = globeSize + 1;
const pathSize = countriesSize + 10;
var scale = 1;
const countriesScale = () => countriesSize * scale;
const pathScale = () => pathSize * scale;

//dragging stuff
const dragSpeed = 0.05;
const maxPhi = 70;

class D3Map {
  constructor(el, journey, props) {
    this.svg = d3.select(el);
    this.svg.append('circle')
        .attr('r', globeSize)
        .attr('fill','white');

    this.countries = this.svg.append('g')
        .attr('class', 'countries');

    this.currentStop = this.svg.append('g')
        .attr('class', 'currentStop');
    this.pastStops = this.svg.append('g')
        .attr('class', 'prevStops');

    this.journeyPath = this.svg.append('g')
        .attr('class', 'path');

    this.journey = journey;

    this.projection = this.makeProjection();
    this.projections = [this.projection];
    this.countriesPath = d3.geoPath().projection(this.projection).pointRadius(1);
    this.centrePos = this.projection.invert([0,0]);

    this.loadCountries();
    this.setupDrag();
  }

  tick(dt) {
    this.journey.tick(dt);
  }

  update(el, props, prevProps) {
    if (this.journey.current == null) {
      this.setupGeolocation(props);
    }
  }

  setupGeolocation(props) {
    if (props.isGeolocationAvailable && props.isGeolocationEnabled && props.coords) {
      this.journey.goTo([props.coords.longitude, props.coords.latitude]);
      this.rotateTo([-props.coords.longitude, -props.coords.latitude]);
    }
  }

  loadCountries() {
    axios.get('/world.geo.json')
      .then(res => {
        this.countries.selectAll('path')
          .data(res.data.features).enter()
        .append('path')
          .attr('class', 'country')
          .attr('d', this.countriesPath)
          .on('click', () => {
            var pos = this.projection.invert(d3.mouse(this.svg.node()));
            this.journey.goTo(pos);
            this.updateJourney();
          });
      });
  }

  setupDrag() {
    this.svg.call(
      d3.drag()
        .on("start", this.dragStarted)
        .on("drag", this.dragged)
      );
  }

  dragStarted = () => {
    this.m0 = [d3.event.x, d3.event.y];
    this.o0 = this.projection.rotate();
  }

  dragged = () => {
    if (this.m0) {
      var m1 = [d3.event.x, d3.event.y];
      var o1 = [
        this.o0[0] + (m1[0] - this.m0[0]) / (dragSpeed * countriesScale()),
        this.o0[1] + (this.m0[1] - m1[1]) / (dragSpeed * countriesScale())
      ];
      o1[1] = o1[1] > maxPhi  ? maxPhi  :
              o1[1] < -maxPhi ? -maxPhi :
              o1[1];
      this.rotateTo(o1);
    }
  }

  rotateTo(o) {
    _.forEach(this.projections, p => p.rotate(o));
    this.updateMap();
  }

  updateMap() {
    this.countries.selectAll('path').attr("d", this.countriesPath);
    this.centrePos = this.projection.invert([0,0]);
    this.updateJourney();
  }

  updatePoints(points) {
    var proj = this.projection;
    var centrePos = this.centrePos;
    points.attr("cx", function(d) { return proj(d.position)[0]})
      .attr("cy", function(d) { return proj(d.position)[1]})
      .classed("d-none", function(d) {
         var d = d3.geoDistance(d.position, centrePos);
         return (d > Math.PI / 2);  //ti fainetai
       });
    return points;
  }

  updateJourney() {
    var cs = this.currentStop.selectAll('circle')
                .data(this.journey.currentStop());

    this.updatePoints(cs);
    this.updatePoints(
      cs.enter().append('circle')
    );

    var ps = this.pastStops.selectAll('circle')
              .data(this.journey.pastStops());

    this.updatePoints(ps);
    this.updatePoints(
      ps.enter()
        .append('circle')
          .attr('opacity', 1)
    ).transition()
        .duration(5000)
        .attr('opacity', 0);

    this.updateJourneyPaths();
  }

  updateJourneyPaths() {
    var journeyLines = this.journeyPath.selectAll('path')
      .data(this.journey.paths());

    var doPath = (d) => {
      var dist = d3.geoDistance(d[0], d[1]);
      var minSize = 0.01;
      var intervals = Math.ceil(dist/minSize);
      if (intervals % 2 == 1) intervals++;
      var interpolate = d3.geoInterpolate(d[0], d[1]);
      var maxHeight = dist * 10;
      var proj = this.makeProjection(countriesScale()).rotate(this.projection.rotate());
      var points = [];
      for (var i = 0; i <= intervals; ++i) {
        var p = interpolate(i/intervals);
        var cdist = d3.geoDistance(p, this.centrePos);
        if (cdist > Math.PI/2) continue;

        var heightRatio = (1 - Math.abs(0.5 - i/intervals) * 2);
        heightRatio = Math.sqrt(1 - (1 - heightRatio) * (1 - heightRatio));
        var newScale = countriesScale() + maxHeight * heightRatio;
        proj.scale(newScale);
        points.push(_.join(proj(p)));
      }
      if (points.length == 0) return '';
      return `M${_.join(points, ' ')}`;
    };

    journeyLines.enter()
      .append('path')
      .attr('class', 'path')
      .attr('d', doPath);

    journeyLines.attr('d', doPath);
  }

  makeProjection(s = countriesScale()) {
    return d3.geoOrthographic()
                        .scale(s)
                        .translate([0,0])
                        .clipAngle(90);
  }

  destroy(el) {

  }
};

export default D3Map;
