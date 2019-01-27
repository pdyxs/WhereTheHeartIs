export default function() {
  var nodes;

  function force() {

    for (var i = 0; i < nodes.length; ++i) {
      var node = nodes[i];
      if (node.position) {
        if (node.type == 'me')
        {
          node.x = node.position[0];
          node.y = node.position[1];
          node.vx = 0;
          node.vy = 0;
        } else {
          var dx = node.x - node.position[0];
          var dy = node.y - node.position[1];
          var dist = Math.sqrt(dx*dx + dy*dy);
          var k = dist * 0.005;
          node.vx = -dx * k;
          node.vy = -dy * k;
        }
      }
    }
  }

  force.initialize = function(_) {
    nodes = _;
  };

  return force;
}
