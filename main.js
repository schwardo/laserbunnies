var svgCanvas = document.querySelector('svg'),
    svgNS = 'http://www.w3.org/2000/svg',
    rectangles = [];
var meeples = [];

var COLORS = ['red', 'green', 'blue', 'pink', 'yellow'];

function Move(from, to, color) {
  this.highlightTile = null;
  this.from = from;
  this.to = to;
  this.color = color;
};

function Prompt(fromOptions, toOptions, minCount, maxCount) {
  this.highlightTile = null;
  this.fromOptions = fromOptions;
  this.toOptions = toOptions;
  this.minCount = minCount;
  this.maxCount = maxCount;
};
  
function Pile(id, x, y, w, h) {
  this.id = id;
  this.x = x + (w / 4);
  this.y = y + (h / 4);
  this.count = 0;
  this.meeples = {};
}
Pile.prototype.next = function(color) {
  return {x: this.x + this.count * 15,
          y: this.y + this.count * 15};
};
Pile.prototype.add = function(meeple) {
  this.count++;
  this.meeples[meeple.id] = meeple;
};
Pile.prototype.remove = function(meeple) {
  this.count--;
  delete this.meeples[meeple.id];
};
Pile.prototype.getMeeples = function() {
  var out = [];
  for (var k in this.meeples) {
    out.push(this.meeples[k]);
  }
  return out;
};

function MultiPile(id, x, y, w, h) {
  this.id = id;
  this.colors = {};
  for (var i = 0; i < COLORS.length; i++) {
    this.colors[COLORS[i]] = new Pile(id + '-' + COLORS[i], x + (i * w / 5), y, w / 5, h);
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
MultiPile.prototype.getMeeples = function() {
  var out = [];
  for (var color in this.colors) {
    var meeples = this.colors[color].getMeeples();
    for (var m in meeples) {
      out.push(meeples[m]);
    }
  }
  return out;
};

var rectanglesSoFar = 0;
function Rectangle (x, y, w, h, svgCanvas, cls) {
  this.x = x;
  this.y = y;
  this.w = w;
  this.h = h;
  this.stroke = 5;
  this.el = document.createElementNS(svgNS, 'rect');
  this.id = rectanglesSoFar++;
  
  this.el.setAttribute('data-index', rectangles.length);
  this.baseClass = cls;
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
        if (draggableElement.pile == pile) {
          return;
        }
        if (draggableElement.pile != null) {
          draggableElement.pile.remove(meeple);
          draggableElement.pile = null;
        }
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
          console.log('Removing meeple ' + meeple.id + ' from pile ' + pile.id);
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

var opponentStash = new MultiPile('O', 0, 0, 1250, 75);
var playerStash = new MultiPile('P', 0, 600, 1250, 75);

var opponentPiles = [];
var playerPiles = [];
var meeples = [];

for (var i = 0; i < 5; i++) {
  var opponentPile = new Pile('O' + i, 250 * i, 125, 250, 225);
  opponentPiles.push(opponentPile);
  new Rectangle(250 * i, 125, 250, 225, svgCanvas, 'tile');

  var playerPile = new Pile('P' + i, 250 * i, 375, 250, 225);
  playerPiles.push(playerPile);
  var tile = new Rectangle(250 * i, 375, 250, 225, svgCanvas, 'tile');
  connectTileToPile(tile, playerPile);
}
new Rectangle(0, 325, 1250, 25, svgCanvas, 'screen');
new Rectangle(0, 350, 1250, 25, svgCanvas, 'screen endbutton');

interact('.endbutton').on('tap', function (event) {
  var i = 0;
  meeples.forEach(function(meeple) {
    if (meeple.el.pile != null &&
        playerPiles.indexOf(meeple.el.pile) >= 0) {
      if (i++ % 2) {
        moveToPile(meeple, playerStash);
      } else {
        moveToPile(meeple, opponentStash);
      }
    }
  });
  normalizeMeeples();
});

function setPileDraggability(pile, draggable) {
  var meeples = pile.getMeeples();
  for (var i in meeples) {
    setMeepleDraggability(meeples[i], draggable);
  }
};

function setMeepleDraggability(meeple, draggable) {
   if (draggable) {
     meeple.el.setAttribute('class', meeple.baseClass + " draggable-meeple");
   } else {
     meeple.el.setAttribute('class', meeple.baseClass);
   }
};

function normalizeMeeples() {
  for (var i in meeples) {
    setMeepleDraggability(meeples[i], false);
  }
  setPileDraggability(playerStash, true);
}

function addMeeples(color, n, pile) {
  for (var i = 0; i < n; i++) {
    var cssClass = 'meeple ' + color;
    var coords = pile.next(color);
    var meeple = new Rectangle(coords.x, coords.y, 50, 50, svgCanvas, cssClass);
    meeple.color = color;
    meeple.el.meeple = meeple;
    meeple.el.pile = pile;
    pile.add(meeple);

    meeples.push(meeple);
  }
}

function addMeeple(color, pile, draggable) {
  addMeeples(color, 1, pile, draggable);
}

addMeeples('red', 4, opponentStash);
addMeeples('red', 4, playerStash);

addMeeples('green', 4, opponentStash);
addMeeples('green', 4, playerStash);

addMeeples('blue', 4, opponentStash);
addMeeples('blue', 4, playerStash);

addMeeples('yellow', 4, opponentStash);
addMeeples('yellow', 4, playerStash);

addMeeples('pink', 4, opponentStash);
addMeeples('pink', 4, playerStash);

normalizeMeeples();
