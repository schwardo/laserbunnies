var svgCanvas = document.querySelector('svg'),
    svgNS = 'http://www.w3.org/2000/svg',
    rectangles = [];
var meeples = [];

var COLORS = ['red', 'green', 'blue', 'pink', 'yellow'];
  
function Pile(x, y, w, h) {
  this.x = x + (w / 2);
  this.y = y + (h / 2);
  this.count = 0;
}
Pile.prototype.nextForColor = function(color) {
  return {x: this.x + this.count * 10,
          y: this.y + this.count * 10};
};
Pile.prototype.add = function(color) {
  this.count++;
};
Pile.prototype.remove = function(color) {
  this.count--;
};

function MultiPile(x, y, w, h) {
  this.colors = {};
  for (var i = 0; i < COLORS.length; i++) {
    this.colors[COLORS[i]] = new Pile(x + (i * w / 5), y, w / 5, h);
  }
}
MultiPile.prototype.nextForColor = function(color) {
  return this.colors[color].nextForColor(color);
};
MultiPile.prototype.add = function(color) {
  this.colors[color].add(color);
};
MultiPile.prototype.remove = function(color) {
  this.colors[color].remove(color);
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

var pile = new MultiPile(0, 200, 1250, 300);
for (var i = 0; i < 20; i++) {
  var color = COLORS[i % COLORS.length];
  
  var coords = pile.nextForColor(color);
  var meeple = new Rectangle(coords.x, coords.y, 60, 60, svgCanvas, 'meeple ' + color);
  pile.add(color);
}
