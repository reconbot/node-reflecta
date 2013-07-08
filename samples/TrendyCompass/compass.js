/*global document:false */

var CENTROID_RADIUS = 10,
CENTROID_STROKE_STYLE = 'rgba(0, 0, 0, 0.5)',
CENTROID_FILL_STYLE   = 'rgba(80, 190, 240, 0.6)',

RING_INNER_RADIUS = 35,
RING_OUTER_RADIUS = 55,

ANNOTATIONS_FILL_STYLE = 'rgba(0, 0, 230, 0.9)',
ANNOTATIONS_TEXT_SIZE = 12,

TICK_WIDTH = 10,
TICK_LONG_STROKE_STYLE = 'rgba(100, 140, 230, 0.9)',
TICK_SHORT_STROKE_STYLE = 'rgba(100, 140, 230, 0.7)',

TRACKING_DIAL_STROKING_STYLE = 'rgba(100, 140, 230, 0.5)',

GUIDEWIRE_STROKE_STYLE = 'goldenrod',
GUIDEWIRE_FILL_STYLE = 'rgba(250, 250, 0, 0.6)';

var context = document.getElementById('foo').getContext('2d');
var circle = { x: context.canvas.width/2, y: context.canvas.height/2, radius: 50 };

function drawCentroid(circle) {
   context.beginPath();
   context.save();
   context.strokeStyle = CENTROID_STROKE_STYLE;
   context.fillStyle = CENTROID_FILL_STYLE;
   context.arc(circle.x, circle.y, CENTROID_RADIUS, 0, Math.PI*2, false);
   context.stroke();
   context.fill();
   context.restore();
}

function drawCentroidGuidewire(circle, angle) {
  var radius = circle.radius + RING_OUTER_RADIUS;

  var endpt = {
    x: circle.x + radius * Math.cos(angle),
    y: circle.y + radius * Math.sin(angle)
  };
   
   context.save();

   context.strokeStyle = GUIDEWIRE_STROKE_STYLE;
   context.fillStyle = GUIDEWIRE_FILL_STYLE;

   context.beginPath();
   context.moveTo(circle.x, circle.y);
   context.lineTo(endpt.x, endpt.y);
   context.stroke();

   context.beginPath();
   context.strokeStyle = TICK_LONG_STROKE_STYLE;
   context.arc(endpt.x, endpt.y, 5, 0, Math.PI*2, false);
   context.fill();
   context.stroke();

   context.restore();
}

function drawRingOuterCircle(circle) {
   context.shadowColor = 'rgba(0, 0, 0, 0.7)';
   context.shadowOffsetX = 3;
   context.shadowOffsetY = 3;
   context.shadowBlur = 6;
   context.strokeStyle = TRACKING_DIAL_STROKING_STYLE;
   context.beginPath();
   context.arc(circle.x, circle.y, circle.radius + RING_OUTER_RADIUS, 0, Math.PI*2, true);
   context.stroke();
}

function drawRing(circle) {
   drawRingOuterCircle(circle);

   context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
   context.arc(circle.x, circle.y, circle.radius + RING_INNER_RADIUS, 0, Math.PI*2, false);

   context.fillStyle = 'rgba(100, 140, 230, 0.1)';
   context.fill();
   context.stroke();
}

function drawTickInnerCircle(circle) {
   context.save();
   context.beginPath();
   context.strokeStyle = 'rgba(0, 0, 0, 0.1)';
   context.arc(circle.x, circle.y, circle.radius + RING_INNER_RADIUS - TICK_WIDTH, 0, Math.PI*2, false);
   context.stroke();
   context.restore();
}
   
function drawTick(angle, radius, cnt) {
   var tickWidth = cnt % 4 === 0 ? TICK_WIDTH : TICK_WIDTH/2;
   
   context.beginPath();
   context.moveTo(circle.x + Math.cos(angle) * (radius - tickWidth), circle.y + Math.sin(angle) * (radius - tickWidth));
   context.lineTo(circle.x + Math.cos(angle) * (radius), circle.y + Math.sin(angle) * (radius));
   context.strokeStyle = TICK_SHORT_STROKE_STYLE;
   context.stroke();
}

function drawTicks(circle) {
   var radius = circle.radius + RING_INNER_RADIUS,
       ANGLE_MAX = 2*Math.PI,
       ANGLE_DELTA = Math.PI/64;

   context.save();
   
   for (var angle = 0, cnt = 0; angle < ANGLE_MAX; angle += ANGLE_DELTA, cnt++) {
      drawTick(angle, radius, cnt++); 
   }

   context.restore();
}

function drawAnnotations(circle) {
   var radius = circle.radius + RING_INNER_RADIUS;

   context.save();
   context.fillStyle = ANNOTATIONS_FILL_STYLE;
   context.font = ANNOTATIONS_TEXT_SIZE + 'px Helvetica'; 
   
   for (var angle=0; angle < 2*Math.PI; angle += Math.PI/4) {
      context.beginPath();
      context.fillText(
        (angle * 180 / Math.PI).toFixed(0),
        circle.x + Math.cos(angle) * (radius - TICK_WIDTH*2),
        circle.y - Math.sin(angle) * (radius - TICK_WIDTH*2)
        );
   }
   
   context.restore();
}

var drawDial = function drawDial(context, circle, angle) {

  // Initialize context
  context.save();
  context.shadowOffsetX = 2;
  context.shadowOffsetY = 2;
  context.shadowBlur = 4;
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  drawCentroid(circle);
  drawCentroidGuidewire(circle, angle);

  drawRing(circle);
  drawTickInnerCircle(circle);
  drawTicks(circle);
  drawAnnotations(circle);

  context.restore();
};