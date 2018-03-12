
function generateUuid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function lineLineIntersection(startA, endA, startB, endB) {
  let intersection = {};

  let b = {x: endA.x - startA.x, y: endA.y - startA.y};
  let d = {x: endB.x - startB.x, y: endB.y - startB.y};
  let bDotDPerp = b.x * d.y - b.y * d.x;

  if (bDotDPerp == 0) { return null; }

  let c = {x: startB.x - startA.x, y: startB.y - startA.y};
  let t = (c.x * d.y - c.y * d.x) / bDotDPerp;
  if (t < 0 || t > 1) { return null; }

  let u = (c.x * b.y - c.y * b.x) / bDotDPerp;
  if (u < 0 || u > 1) { return null; }

  return {x: startA.x + t * b.x, y: startA.y + t * b.y};
}

function lineAabbIntersection(start, end, aabb) {
  return lineLineIntersection(start, end, aabb.topLeft, aabb.topRight) ||
          lineLineIntersection(start, end, aabb.topRight, aabb.bottomRight) ||
          lineLineIntersection(start, end, aabb.bottomRight, aabbb.bottomLeft) ||
          lineLineIntersection(start, end, aabb.bottomLeft, aabb.topLeft);
}

function generateAabb(center, width, height) {
  let halfWidth = width/2;
  let halfHeight = height/2;

  return {
    topLeft: {x: center.x - halfWidth, y: center.y - halfHeight},
    topRight: {x: center.x + halfWidth, y: center.y - halfHeight},
    bottomRight: {x: center.x + halfWidth, y: center.y + halfHeight},
    bottomLeft: {x: center.x - halfWidth, y: center.y + halfHeight}
  };
}

export { generateUuid, lineAabbIntersection, generateAabb };