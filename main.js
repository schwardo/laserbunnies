var svgCanvas = document.querySelector('svg'),
    svgNS = 'http://www.w3.org/2000/svg',
    rectangles = [];
var meeples = [];

var COLORS = ['red', 'green', 'blue', 'pink', 'yellow'];
  
function Pile(x, y, w, h) {
  this.x = x + (w / 4);
  this.y = y + (h / 4);
  this.count = 0;
}
Pile.prototype.next = function(color) {
  return {x: this.x + this.count * 15,
          y: this.y + this.count * 15};
};
Pile.prototype.add = function(meeple) {
  this.count++;
};
Pile.prototype.remove = function(meeple) {
  this.count--;
};

function MultiPile(x, y, w, h) {
  this.colors = {};
  for (var i = 0; i < COLORS.length; i++) {
    this.colors[COLORS[i]] = new Pile(x + (i * w / 5), y, w / 5, h);
  }
}
MultiPile.prototype.next = function(color) {
  return this.colors[color].next(color);
};
MultiPile.prototype.add = function(meeple) {
  this.colors[meeple.color].add(meeple);
};
MultiPile.prototype.remove = function(meeple) {
  this.colors[meeple.color].remove(meeple);
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

function connectTileToPile(tile, pile) {
interact(tile.el).dropzone({
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
            
        var meeple = draggableElement.meeple;

        // feedback the possibility of a drop
        dropzoneElement.classList.add('drop-target');
        draggableElement.classList.add('can-drop');
        var dropCenter = pile.next(meeple.color);
        draggableElement.pile = pile;
        pile.add(meeple);
        
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
        if (draggableElement.pile != null) {
          var meeple = draggableElement.meeple;
          pile.remove(meeple);
          draggableElement.pile = null;
        }
    },
    ondrop: function (event) {
    },
    ondropdeactivate: function (event) {
        // remove active dropzone feedback
        event.target.classList.remove('drop-active');
        event.target.classList.remove('drop-target');
    }
});
}

function triggerMove(target, dx, dy) {
  var x = (parseFloat(target.getAttribute('data-x')) || 0) + dx;
  var y = (parseFloat(target.getAttribute('data-y')) || 0) + dy;

  target.style.webkitTransform =
  target.style.transform =
      'translate(' + x + 'px, ' + y + 'px)';

  target.setAttribute('data-x', x);
  target.setAttribute('data-y', y);
};

function moveToPile(meeple, pile) {
  var oldPile = meeple.el.pile;
  if (meeple.el.pile != null) {
    meeple.el.pile.remove(meeple);
    meeple.el.pile = null;
  }
  
  var coords = pile.next(meeple.color);
  pile.add(meeple);

  var bb = meeple.el.getBoundingClientRect();
  var canvasBb = svgCanvas.getBoundingClientRect();
  
  var dx = coords.x - bb.left + canvasBb.left;
  var dy = coords.y - bb.top + canvasBb.top;
  
  triggerMove(meeple.el, dx, dy);
  meeple.el.setAttribute('canvas-x', coords.x);
  meeple.el.setAttribute('canvas-y', coords.y);

  meeple.el.pile = pile;
};

  interact('.draggable-meeple')
    .draggable({
        onmove: function (event) {
            var target = event.target;
            triggerMove(target, event.dx, event.dy);
        },
        onend: function (event) {
           var rect = svgCanvas.getBoundingClientRect();
           event.target.setAttribute('canvas-x', event.clientX - rect.left);
           event.target.setAttribute('canvas-y', event.clientY - rect.top);
        },
        restrict: {
          restriction: {
            x: 0,
            y: 375,
            width: 1250,
            height: 300,
            elementRect: { left: 1, right: 1, top: 1, bottom: 1 }
          }
        }
    })
    .inertia(true)
//    .dynamicDrop(true)
    .snap({
      mode: 'anchor',
      anchors: [],
      range: Infinity,
      elementOrigin: { x: 0.5, y: 0.5 },
      endOnly: true});

// enable draggables to be dropped into this
/*
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
*/

interact.maxInteractions(Infinity);

var opponentStash = new MultiPile(0, 0, 1250, 75);
var playerStash = new MultiPile(0, 600, 1250, 75);

var opponentTile1Pile = new Pile(0, 125, 250, 225);
var opponentTile2Pile = new Pile(250, 375, 250, 225);

var playerTile1Pile = new Pile(0, 400, 250, 100);
var playerTile2Pile = new Pile(250, 400, 250, 100);

var opponentPiles = [];
var playerPiles = [];
var meeples = [];

for (var i = 0; i < 5; i++) {
  var opponentPile = new Pile(250 * i, 125, 250, 225);
  opponentPiles.push(opponentPile);
  new Rectangle(250 * i, 125, 250, 225, svgCanvas, 'tile');

  var playerPile = new Pile(250 * i, 375, 250, 225);
  playerPiles.push(playerPile);
  var tile = new Rectangle(250 * i, 375, 250, 225, svgCanvas, 'tile');
  connectTileToPile(tile, playerPile);
}
new Rectangle(0, 325, 1250, 25, svgCanvas, 'screen');
new Rectangle(0, 350, 1250, 25, svgCanvas, 'screen endbutton');

interact('.endbutton').on('tap', function (event) {
  meeples.forEach(function(meeple) {
    if (meeple.el.pile != null &&
        playerPiles.indexOf(meeple.el.pile) >= 0) {
      moveToPile(meeple, playerStash);
        var where = playerStash.next(meeple.color);
//        triggerMove(meeple.el, meeple.el.getAttribute("data-x"), meeple.el.getAttribute("data-y") + 50);
//        triggerMove(meeple.el, where.x, meeple.el.getAttribute("data-y"));
/*
        console.log("Trying to move from " + meeple.el.getAttribute("data-x") + "," + meeple.el.getAttribute("data-y") + " to " + where.x + "," + where.y);
        console.log("Canvas X,Y: " + meeple.el.getAttribute("canvas-x") + "," + meeple.el.getAttribute("canvas-y"));

        var rect = svgCanvas.getBoundingClientRect();
        console.log("Bounding box: " + rect.left + "," + rect.top);
        var x = meeple.el.getAttribute("canvas-x") - 
        triggerMove(meeple.el, meeple.el.getAttribute("data-x"), where.y);
        */
    }
  });
});

function addMeeples(color, n, pile, draggable) {
  for (var i = 0; i < n; i++) {
    var cssClass = 'meeple ' + color;
    if (draggable) {
      cssClass += ' draggable-meeple';
    }
    var coords = pile.next(color);
    var meeple = new Rectangle(coords.x, coords.y, 50, 50, svgCanvas, cssClass);
    meeple.color = color;
    meeple.el.meeple = meeple;
    pile.add(meeple);

    meeples.push(meeple);
  }
}

function addMeeple(color, pile, draggable) {
  addMeeples(color, 1, pile, draggable);
}

addMeeples('red', 4, opponentStash, false);
addMeeples('red', 4, playerStash, true);

addMeeples('green', 4, opponentStash, false);
addMeeples('green', 4, playerStash, true);

addMeeples('blue', 4, opponentStash, false);
addMeeples('blue', 4, playerStash, true);

addMeeples('yellow', 4, opponentStash, false);
addMeeples('yellow', 4, playerStash, true);

addMeeples('pink', 4, opponentStash, false);
addMeeples('pink', 4, playerStash, true);
