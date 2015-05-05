var svgCanvas = document.querySelector('svg'),
    svgNS = 'http://www.w3.org/2000/svg',
    rectangles = [];
var meeples = [];
  
function Pile(x, y, svgCanvas, cls) {
  this.x = x;
  this.y = y;
  this.count = 0;
}

Pile.prototype.nextPosition = function() {
  return {x: this.x + this.count * 10,
          y: this.y + this.count * 10};
};
Pile.prototype.add = function() {
  this.count++;
};
Pile.prototype.remove = function() {
  this.count--;
};

function Rectangle (x, y, w, h, svgCanvas, cls) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.stroke = 5;
  this.el = document.createElementNS(svgNS, 'rect');
  
  this.el.setAttribute('data-index', rectangles.length);
  this.el.setAttribute('class', cls);
  rectangles.push(this);

  this.draw();
  svgCanvas.appendChild(this.el);
}

Rectangle.prototype.draw = function () {
  this.el.setAttribute('x', this.x + this.stroke / 2);
  this.el.setAttribute('y', this.y + this.stroke / 2);
//  this.el.setAttribute('data-x', this.x + this.stroke / 2);
//  this.el.setAttribute('data-y', this.y + this.stroke / 2);
  this.el.setAttribute('width' , this.w - this.stroke);
  this.el.setAttribute('height', this.h - this.stroke);
  this.el.setAttribute('stroke-width', this.stroke);
  this.el.setAttribute('canvas-x', this.x);
  this.el.setAttribute('canvas-y', this.y);
};

  interact('.meeple')
    .draggable({
        onmove: function (event) {
            var target = event.target,
                x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx,
                y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

            target.style.webkitTransform =
            target.style.transform =
                'translate(' + x + 'px, ' + y + 'px)';

            target.setAttribute('data-x', x);
            target.setAttribute('data-y', y);
        },
        onend: function (event) {
           var rect = svgCanvas.getBoundingClientRect();
           event.target.setAttribute('canvas-x', event.clientX - rect.left);
           event.target.setAttribute('canvas-y', event.clientY - rect.top);
        }
    })
    .inertia(true)
    .restrict({
        drag: "parent",
        endOnly: true,
        elementRect: { top: 0, left: 0, bottom: 1, right: 1 }
    })
  .snap({
      mode: 'anchor',
      anchors: [],
      range: Infinity,
      elementOrigin: { x: 0.5, y: 0.5 },
      endOnly: true
});

interact('.playerscreen')
  .draggable({
    axis: 'x',
    containment: "#containment-wrapperDown",
    scroll: true,
    scrollSensitivity: 100,
    scrollSpeed: 25,
    cursor: '-moz-grabbing',
    drag: function () {
        var x = $('.playerscreen').position().top;
        $("#containment-wrapperDown").css({
            top: x
        });
    }
  })
  .inertia(true)
  .restrict({
      restriction: {
        left: 0,
        top: 0,
        bottom: 0,
        right: 5000,
        elementRect: { left: 1, right: 1, top: 0, bottom: 0},
        endOnly: false
      }
});

function isMeepleAt(coords) {
  console.log("Is there a meeple at: " + coords.x + "," + coords.y);
  for (var i = 0; i < meeples.length; i++) {
    var m = meeples[i];
  var x = parseFloat(m.el.getAttribute('canvas-x')) || 0;
  var y = parseFloat(m.el.getAttribute('canvas-y')) || 0;
  console.log("... " + i + ") " + x + "+" + 60 + "," + y + "+" + 60);
    if (coords.x >= (x - 30) &&
        coords.y >= (y - 30) &&
        (coords.x <= (x + 30)) &&
        (coords.y <= (y + 30))) {
  console.log("... yes");
          return true;
        }
  }
  console.log("... no");
  return false;
}

// enable draggables to be dropped into this
interact('.dropzone').dropzone({
    // only accept elements matching this CSS selector
    accept: '.meeple',
    // Require a 75% element overlap for a drop to be possible
    overlap: 0.75,

    // listen for drop related events:

    ondropactivate: function (event) {
        // add active dropzone feedback
        event.target.classList.add('drop-active');

    },
    ondragenter: function (event) {
        var draggableElement = event.relatedTarget,
            dropzoneElement = event.target;

        // feedback the possibility of a drop
        dropzoneElement.classList.add('drop-target');
        draggableElement.classList.add('can-drop');
        var dropRect = interact.getElementRect(event.target),
            dropCenter = {
              x: dropRect.left + dropRect.width  / 2,
              y: dropRect.top  + dropRect.height / 2
            };
        while (isMeepleAt(dropCenter) && dropCenter.x < 1000) {
          dropCenter.x += 10;
          dropCenter.y += 10;
        }

        event.draggable.snap({
          anchors: [ dropCenter ]
        });

    },
    ondragleave: function (event) {
        var draggableElement = event.relatedTarget,
            dropzoneElement = event.target;
        // remove the drop feedback style
        event.target.classList.remove('drop-target');
        event.relatedTarget.classList.remove('can-drop');
        event.draggable.snap(false);
    },
    ondrop: function (event) {
        //Dropped event
    },
    ondropdeactivate: function (event) {
        // remove active dropzone feedback
        event.target.classList.remove('drop-active');
        event.target.classList.remove('drop-target');
    }
});

interact.maxInteractions(Infinity);

new Rectangle(0, 350, 1250, 400, svgCanvas, 'homebase');
for (var i = 0; i < 5; i++) {
  new Rectangle(250 * i, 75, 250, 100, svgCanvas, 'tile');
  new Rectangle(250 * i, 225, 250, 200, svgCanvas, 'tile dropzone');
}
new Rectangle(0, 175, 1250, 25, svgCanvas, 'screen');
new Rectangle(0, 200, 1250, 25, svgCanvas, 'screen playerscreen');

for (var i = 3; i < 4; i++) {
  for (var j = 0; j < 4; j++) {
  meeples.push(new Rectangle(80, 350 + 75 * i, 60, 60, svgCanvas, 'meeple red'));
  meeples.push(new Rectangle(330, 350 + 75 * i, 60, 60, svgCanvas, 'meeple green'));
  meeples.push(new Rectangle(580, 350 + 75 * i, 60, 60, svgCanvas, 'meeple blue'));
  meeples.push(new Rectangle(830, 350 + 75 * i, 60, 60, svgCanvas, 'meeple pink'));
  meeples.push(new Rectangle(1080, 350 + 75 * i, 60, 60, svgCanvas, 'meeple yellow'));
  }
}
