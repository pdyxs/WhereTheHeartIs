import constant from "./constant.js";
import jiggle from "./jiggle.js";
import * as d3 from 'd3';

function index(d) {
  return d.index;
}

function find(nodeById, nodeId) {
  var node = nodeById.get(nodeId);
  if (!node) throw new Error("missing: " + nodeId);
  return node;
}

export default function(links) {
  var id = index,
      strength = defaultStrength,
      strengths,
      distance = constant(30),
      distances,
      nodes,
      count,
      bias,
      iterations = 1;

  if (links == null) links = [];

  function defaultStrength(link) {
    return 1 / Math.min(count[link.source.index], count[link.target.index]);
  }

  function force(alpha) {
    for (var k = 0, n = links.length; k < iterations; ++k) {
      for (var i = 0, link, source, target, tp, sp, np, l, b; i < n; ++i) {
        link = links[i], source = link.source, target = link.target;
        tp = [target.x + target.vx, target.y + target.vy];
        sp = [source.x + source.vx, source.y + source.vy];
        l = d3.geoDistance(tp,sp);
        if (l < 1e-6) continue;
        np = d3.geoInterpolate(tp, sp)((l - distances[i]) / l * alpha * strengths[i]);
        np = [
          np[0] - (target.x + target.vx) || jiggle(),
          np[1] - (target.y + target.vy) || jiggle()
        ];
        while (np[0] > 180) np -= 360;
        while (np[0] <= -180) np += 360;
        while (np[1] > 90) np -= 180;
        while (np[1] <= -90) np += 180;
        // x = target.x + target.vx - source.x - source.vx || jiggle();
        // y = target.y + target.vy - source.y - source.vy || jiggle();
        // l = Math.sqrt(x * x + y * y);
        // l = (l - distances[i]) / l * alpha * strengths[i];
        // x *= l, y *= l;
        target.vx += np[0] * (b = bias[i]);
        target.vy += np[1] * b;
        // source.vx += np[0] * (b = 1 - b);
        // source.vy += np[1] * b;
      }
    }
  }

  function initialize() {
    if (!nodes) return;

    var i,
        n = nodes.length,
        m = links.length,
        nodeById = new Map(nodes.map((d, i) => [id(d, i, nodes), d])),
        link;

    for (i = 0, count = new Array(n); i < m; ++i) {
      link = links[i], link.index = i;
      if (typeof link.source !== "object") link.source = find(nodeById, link.source);
      if (typeof link.target !== "object") link.target = find(nodeById, link.target);
      count[link.source.index] = (count[link.source.index] || 0) + 1;
      count[link.target.index] = (count[link.target.index] || 0) + 1;
    }

    for (i = 0, bias = new Array(m); i < m; ++i) {
      link = links[i], bias[i] = count[link.source.index] / (count[link.source.index] + count[link.target.index]);
    }

    strengths = new Array(m), initializeStrength();
    distances = new Array(m), initializeDistance();
  }

  function initializeStrength() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      strengths[i] = +strength(links[i], i, links);
    }
  }

  function initializeDistance() {
    if (!nodes) return;

    for (var i = 0, n = links.length; i < n; ++i) {
      distances[i] = +distance(links[i], i, links);
    }
  }

  force.initialize = function(_) {
    nodes = _;
    initialize();
  };

  force.links = function(_) {
    return arguments.length ? (links = _, initialize(), force) : links;
  };

  force.id = function(_) {
    return arguments.length ? (id = _, force) : id;
  };

  force.iterations = function(_) {
    return arguments.length ? (iterations = +_, force) : iterations;
  };

  force.strength = function(_) {
    return arguments.length ? (strength = typeof _ === "function" ? _ : constant(+_), initializeStrength(), force) : strength;
  };

  force.distance = function(_) {
    return arguments.length ? (distance = typeof _ === "function" ? _ : constant(+_), initializeDistance(), force) : distance;
  };

  return force;
}
