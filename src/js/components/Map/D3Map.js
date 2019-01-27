import * as d3 from "d3";
import topojson from 'topojson';
import Victor from 'victor';
import axios from 'axios';
import stayAtPosition from './Sim/stayAtPosition';
import forceCollide from './Sim/forceCollide';
import forceLink from './Sim/link';

import createSVG from './svg';

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
  constructor(el, journey, props, coords) {
    this.startCoords = coords;
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

    this.stringsParent = this.svg.append('g')
        .attr('class', 'strings');

    this.simulationParent = this.svg.append('g')
        .attr('class', 'simulation');

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

  update(el, props, prevProps) {
    if (this.simulationNodes &&
      this.simulationNodes.length - 2 != this.journey.attachments.length)
    {
      this.updateAttachments();
    }
  }

  projectedNodePosition(node) {
    return this.projection([
      node.x, node.y,
    ]);
  }

  updateAttachments = () => {
    this.simulationNodes = [
      this.simulatedPerson,
      this.simulatedHeart,
      ...this.journey.attachments,
    ];
    this.simulation.nodes(this.simulationNodes);
    this.updateSimulatedNodes;

    var that = this;
    this.forceEdges =
      _.reduce(this.simulationNodes,
        (acc, node, index) => {
          if (node == that.simulatedHeart) return acc;
          acc.push({source: index, target: 1});
          return acc;
        }, []);
    this.forceLink.links(this.forceEdges);
  }

  updateSimulatedNodes = () => {
    var nodes = this.simulationParent.selectAll('svg')
      .data(this.simulationNodes || []);

    var that = this;
    function updateNodes(nodes) {
      nodes.attr("x", d => that.projectedNodePosition(d)[0] - d.size/2)
           .attr("y", d => that.projectedNodePosition(d)[1] - d.size/2)
           .attr("width", d => d.size)
           .attr("height", d => d.size)
           .attr('class', d => `simulatedNode ${d.type}`)
           .classed("d-none", function(d) {
              var d = d3.geoDistance([d.x, d.y], centrePos);
              return (d > Math.PI / 2);
            });
      return nodes;
    }

    var centrePos = this.centrePos;
    var entering = nodes.enter();
    updateNodes(entering.select(
      d => createSVG(this.simulationParent, d.image)
    ));
    updateNodes(nodes);

    var strings = this.stringsParent.selectAll('path')
      .data(this.forceEdges);

    var positionFromLink = (link) => {
      return [
        [link.source.x, link.source.y],
        [link.target.x, link.target.y]
      ];
    };
    strings.enter().append('path')
      .attr('class', 'string')
      .attr('d', d => this.buildPathBetween(0)(positionFromLink(d)));

    strings.attr('d', d => this.buildPathBetween(0)(positionFromLink(d)));
  }

  moveSimulatedPerson() {
    this.simulatedPerson.position = this.journey.current.position;
  }

  setupSimulation() {
    this.simulatedPerson = {
      position: this.journey.current.position,
      x: this.journey.current.position[0],
      y: this.journey.current.position[1],
      type: 'me',
      image: 'user',
      size: 6,
      order: 1
    };

    this.simulatedHeart = {
      x: this.journey.current.position[0],
      y: this.journey.current.position[1],
      type: 'heart',
      image: 'heart',
      size: 6,
      order: 3
    };
    this.simulationNodes = [
      this.simulatedPerson,
      this.simulatedHeart
    ];

    this.simulation = d3.forceSimulation(this.simulationNodes);
    this.simulation.alphaTarget(.25);

    this.forceEdges = [
      {source: 0, target: 1}
    ];
    this.forceLink = forceLink(this.forceEdges).distance(0);
    this.simulation.force("towardsPlayer", this.forceLink);

    this.simulation.force("stayHome", stayAtPosition());

    this.simulation.force("collision",
      forceCollide(
        d => d.type == 'me' ? 2 : 1
      )
    );

    this.simulation.on("tick", this.updateSimulatedNodes)
  }

  setupGeolocation(coords) {
    this.goToPlace(coords);
    this.rotateTo([-coords[0], -coords[1]]);
  }

  goToPlace(coords) {
    var isFirst = this.journey.current == null;
    this.journey.goTo(coords);
    this.updateJourney();
    if (isFirst) {
      this.setupSimulation();
    } else {
      this.moveSimulatedPerson();
    }
  }

  onCountryClicked = () => {
    var pos = this.projection.invert(d3.mouse(this.svg.node()));
    this.goToPlace(pos);
  }

  loadCountries() {
    axios.get('/world.geo.json')
      .then(res => {
        this.countries.selectAll('path')
          .data(res.data.features).enter()
        .append('path')
          .attr('class', 'country')
          .attr('d', this.countriesPath)
          .on('click', this.onCountryClicked);

        if (this.startCoords != null) {
          this.setupGeolocation(this.startCoords);
        }
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

  buildPathBetween = (extraHeight, minSize = 0.02) => ((d) => {
    var dist = d3.geoDistance(d[0], d[1]);
    if (dist == 0) return '';
    var intervals = Math.ceil(dist/minSize);
    if (intervals % 2 == 1) intervals++;
    var interpolate = d3.geoInterpolate(d[0], d[1]);
    var maxHeight = dist * extraHeight;
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
  });

  updateJourneyPaths() {
    var journeyLines = this.journeyPath.selectAll('path')
      .data(this.journey.paths());

    journeyLines.enter()
      .append('path')
      .attr('class', 'path')
      .attr('d', this.buildPathBetween(10));

    journeyLines.attr('d', this.buildPathBetween(10));
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
