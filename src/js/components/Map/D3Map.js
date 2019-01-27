import * as d3 from "d3";
import topojson from 'topojson';
import Victor from 'victor';
import axios from 'axios';
import stayAtPosition from './Sim/stayAtPosition';
import forceCollide from './Sim/forceCollide';
import forceLink from './Sim/link';

import {
  attachNamedSVG,
  attachSVG
} from './svg';

import _ from 'lodash';

function isTouchDevice(){
    return true == ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}

const globeSize = 99.75;
const countriesSize = globeSize + .25;
const pathSize = countriesSize + 10;
var scale = 1;
const countriesScale = () => countriesSize * scale;
const pathScale = () => pathSize * scale;

const globeColours = d3.interpolate(
  {colors: ["#888888", "#555555", "#000000"]},
  {colors: ["#60E0DC", "#21B256", "#222299"]}
);

//dragging stuff
const dragSpeed = 0.05;
const maxPhi = 70;

class D3Map {
  constructor(el, journey, props, coords, useCoords) {
    if (useCoords)
      this.startCoords = coords;

    this.svg = d3.select(el);
    this.svg.style('background-color', globeColours(0).colors[2])
    this.ocean = this.svg.append('circle')
        .attr('r', globeSize)
        .attr('class','ocean')
        .attr('fill', globeColours(0).colors[0]);

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

    if (coords) {
      this.rotateTo([-coords[0], -coords[1]]);
    }
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
    var happiness = _.reduce(this.journey.attachments,
      (acc, attachment, index) => {
        var dist = d3.geoDistance(this.simulatedPerson.position, attachment.position);
        return acc + 1 / (Math.max(1, dist * 8));
      }, 0);
    happiness = Math.min(1, happiness/10);
    var colours = globeColours(happiness).colors;
    this.ocean.attr('fill', colours[0]);
    this.countries.selectAll('.country').attr('fill', colours[1]);
    this.svg.style('background-color', colours[2])

    var nodes = this.simulationParent.selectAll('svg.simulatedNode')
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

    const commentSize = 5000;
    function createAttachmentNodes(nodes) {
      var attachmentsvgs = [];
      nodes.each(d => attachmentsvgs.push(d.svg));
      var svgs = nodes.select((d, i, j) => attachNamedSVG(j[i], 'comment'))
        .attr("width", commentSize)
        .attr("height", 0)
        .attr("x", -commentSize * 0.45)
        .attr("y", 0)
        .attr("class", 'comment');
      svgs.select((d,i,j) => attachSVG(j[i], attachmentsvgs[i]))
          .attr("x", 25)
          .attr("y", 25)
          .attr("width", 462)
          .attr("height", 370)
          .attr("class", "attachmentSpecifier")
      svgs.transition()
          .attr("height", commentSize)
          .attr("y", -commentSize);
      svgs.transition()
          .delay(2000)
          .attr("height", 0)
          .attr("y", 0)
          .end().then(
            () => {
              svgs.remove();
              nodes.on("mouseover", (el, i, j) => {
                if (d3.select(j[i]).selectAll('svg.comment').size() > 0) return;
                var svg = d3.select(attachNamedSVG(j[i], 'comment'))
                    .attr("width", commentSize)
                    .attr("height", 0)
                    .attr("x", -commentSize * 0.45)
                    .attr("y", 0)
                    .attr("class", 'comment');
                svg.transition()
                    .attr("height", commentSize)
                    .attr("y", -commentSize);
                svg.select((d,i,j) => attachSVG(j[i], attachmentsvgs[i]))
                    .attr("x", 25)
                    .attr("y", 25)
                    .attr("width", 462)
                    .attr("height", 370)
                    .attr("class", "attachmentSpecifier");
              }).on("mouseout", (el, i, j) => {
                  var svg = d3.select(j[i]).selectAll("svg.comment");
                  svg.transition()
                      .attr("height", 0)
                      .attr("y", 0)
                      .end().then(
                        () => svg?.remove()
                      );
              });
            }
          );
    }

    var centrePos = this.centrePos;
    createAttachmentNodes(
      updateNodes(
        nodes.enter().select(
          d => attachNamedSVG(this.simulationParent, d.image)
        )
      ).filter(d => _.includes(d.type, 'attachment'))
    );
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
    // this.rotateTo([-coords[0], -coords[1]]);
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
          .attr('fill', globeColours(0).colors[1])
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

  end() {
    this.countries.selectAll('.country').on('click', () => {});
  }

  destroy(el) {
  }
};

export default D3Map;
