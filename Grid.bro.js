var require = function (file, cwd) {
    var resolved = require.resolve(file, cwd || '/');
    var mod = require.modules[resolved];
    if (!mod) throw new Error(
        'Failed to resolve module ' + file + ', tried ' + resolved
    );
    var cached = require.cache[resolved];
    var res = cached? cached.exports : mod();
    return res;
};

require.paths = [];
require.modules = {};
require.cache = {};
require.extensions = [".js",".coffee",".json"];

require._core = {
    'assert': true,
    'events': true,
    'fs': true,
    'path': true,
    'vm': true
};

require.resolve = (function () {
    return function (x, cwd) {
        if (!cwd) cwd = '/';
        
        if (require._core[x]) return x;
        var path = require.modules.path();
        cwd = path.resolve('/', cwd);
        var y = cwd || '/';
        
        if (x.match(/^(?:\.\.?\/|\/)/)) {
            var m = loadAsFileSync(path.resolve(y, x))
                || loadAsDirectorySync(path.resolve(y, x));
            if (m) return m;
        }
        
        var n = loadNodeModulesSync(x, y);
        if (n) return n;
        
        throw new Error("Cannot find module '" + x + "'");
        
        function loadAsFileSync (x) {
            x = path.normalize(x);
            if (require.modules[x]) {
                return x;
            }
            
            for (var i = 0; i < require.extensions.length; i++) {
                var ext = require.extensions[i];
                if (require.modules[x + ext]) return x + ext;
            }
        }
        
        function loadAsDirectorySync (x) {
            x = x.replace(/\/+$/, '');
            var pkgfile = path.normalize(x + '/package.json');
            if (require.modules[pkgfile]) {
                var pkg = require.modules[pkgfile]();
                var b = pkg.browserify;
                if (typeof b === 'object' && b.main) {
                    var m = loadAsFileSync(path.resolve(x, b.main));
                    if (m) return m;
                }
                else if (typeof b === 'string') {
                    var m = loadAsFileSync(path.resolve(x, b));
                    if (m) return m;
                }
                else if (pkg.main) {
                    var m = loadAsFileSync(path.resolve(x, pkg.main));
                    if (m) return m;
                }
            }
            
            return loadAsFileSync(x + '/index');
        }
        
        function loadNodeModulesSync (x, start) {
            var dirs = nodeModulesPathsSync(start);
            for (var i = 0; i < dirs.length; i++) {
                var dir = dirs[i];
                var m = loadAsFileSync(dir + '/' + x);
                if (m) return m;
                var n = loadAsDirectorySync(dir + '/' + x);
                if (n) return n;
            }
            
            var m = loadAsFileSync(x);
            if (m) return m;
        }
        
        function nodeModulesPathsSync (start) {
            var parts;
            if (start === '/') parts = [ '' ];
            else parts = path.normalize(start).split('/');
            
            var dirs = [];
            for (var i = parts.length - 1; i >= 0; i--) {
                if (parts[i] === 'node_modules') continue;
                var dir = parts.slice(0, i + 1).join('/') + '/node_modules';
                dirs.push(dir);
            }
            
            return dirs;
        }
    };
})();

require.alias = function (from, to) {
    var path = require.modules.path();
    var res = null;
    try {
        res = require.resolve(from + '/package.json', '/');
    }
    catch (err) {
        res = require.resolve(from, '/');
    }
    var basedir = path.dirname(res);
    
    var keys = (Object.keys || function (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    })(require.modules);
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key.slice(0, basedir.length + 1) === basedir + '/') {
            var f = key.slice(basedir.length);
            require.modules[to + f] = require.modules[basedir + f];
        }
        else if (key === basedir) {
            require.modules[to] = require.modules[basedir];
        }
    }
};

(function () {
    var process = {};
    var global = typeof window !== 'undefined' ? window : {};
    var definedProcess = false;
    
    require.define = function (filename, fn) {
        if (!definedProcess && require.modules.__browserify_process) {
            process = require.modules.__browserify_process();
            definedProcess = true;
        }
        
        var dirname = require._core[filename]
            ? ''
            : require.modules.path().dirname(filename)
        ;
        
        var require_ = function (file) {
            var requiredModule = require(file, dirname);
            var cached = require.cache[require.resolve(file, dirname)];

            if (cached && cached.parent === null) {
                cached.parent = module_;
            }

            return requiredModule;
        };
        require_.resolve = function (name) {
            return require.resolve(name, dirname);
        };
        require_.modules = require.modules;
        require_.define = require.define;
        require_.cache = require.cache;
        var module_ = {
            id : filename,
            filename: filename,
            exports : {},
            loaded : false,
            parent: null
        };
        
        require.modules[filename] = function () {
            require.cache[filename] = module_;
            fn.call(
                module_.exports,
                require_,
                module_,
                module_.exports,
                dirname,
                filename,
                process,
                global
            );
            module_.loaded = true;
            return module_.exports;
        };
    };
})();


require.define("path",function(require,module,exports,__dirname,__filename,process,global){function filter (xs, fn) {
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (fn(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length; i >= 0; i--) {
    var last = parts[i];
    if (last == '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Regex to split a filename into [*, dir, basename, ext]
// posix version
var splitPathRe = /^(.+\/(?!$)|\/)?((?:.+?)?(\.[^.]*)?)$/;

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
var resolvedPath = '',
    resolvedAbsolute = false;

for (var i = arguments.length; i >= -1 && !resolvedAbsolute; i--) {
  var path = (i >= 0)
      ? arguments[i]
      : process.cwd();

  // Skip empty and invalid entries
  if (typeof path !== 'string' || !path) {
    continue;
  }

  resolvedPath = path + '/' + resolvedPath;
  resolvedAbsolute = path.charAt(0) === '/';
}

// At this point the path should be resolved to a full absolute path, but
// handle relative paths to be safe (might happen when process.cwd() fails)

// Normalize the path
resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
var isAbsolute = path.charAt(0) === '/',
    trailingSlash = path.slice(-1) === '/';

// Normalize the path
path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }
  
  return (isAbsolute ? '/' : '') + path;
};


// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    return p && typeof p === 'string';
  }).join('/'));
};


exports.dirname = function(path) {
  var dir = splitPathRe.exec(path)[1] || '';
  var isWindows = false;
  if (!dir) {
    // No dirname
    return '.';
  } else if (dir.length === 1 ||
      (isWindows && dir.length <= 3 && dir.charAt(1) === ':')) {
    // It is just a slash or a drive letter with a slash
    return dir;
  } else {
    // It is a full dirname, strip trailing slash
    return dir.substring(0, dir.length - 1);
  }
};


exports.basename = function(path, ext) {
  var f = splitPathRe.exec(path)[2] || '';
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPathRe.exec(path)[3] || '';
};

exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

});

require.define("__browserify_process",function(require,module,exports,__dirname,__filename,process,global){var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
        && window.setImmediate;
    var canPost = typeof window !== 'undefined'
        && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    if (canPost) {
        var queue = [];
        window.addEventListener('message', function (ev) {
            if (ev.source === window && ev.data === 'browserify-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('browserify-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

process.binding = function (name) {
    if (name === 'evals') return (require)('vm')
    else throw new Error('No such module. (Possibly not yet loaded)')
};

(function () {
    var cwd = '/';
    var path;
    process.cwd = function () { return cwd };
    process.chdir = function (dir) {
        if (!path) path = require('path');
        cwd = path.resolve(dir, cwd);
    };
})();

});

require.define("/Image.js",function(require,module,exports,__dirname,__filename,process,global){var Mouse = require("./Mouse")
var Base = require("./Base")

var Tile = require("./Tile")
var Grid = require("./Grid")

var Map = (function () {
    function Map(parent, template, proj, loc, zoom) {
        this.selection = d3.select(parent);
        this.loaded_tiles = {
        };
        this.template = template;
        this.parent = parent;
        Mouse.link_control(this.selection, new Mouse.Control(this, true));
        var size = Mouse.element_size(this.parent), coord = proj.locationCoordinate(loc).zoomTo(zoom);
        this.grid = new Grid.Grid(size.x, size.y, coord, 3);
        this.projection = proj;
        this.queue = new Queue(this.loaded_tiles);
        this.tile_queuer = this.getTileQueuer();
        this.tile_dequeuer = this.getTileDequeuer();
        this.tile_onloaded = this.getTileOnloaded();
        var map = this;
        d3.select(window).on('resize.map', function () {
            map.update_gridsize();
        });
        this.selection.selectAll('img.tile').remove();
        this.redraw(false);
    }
    Map.prototype.update_gridsize = function () {
        var size = Mouse.element_size(this.parent);
        this.grid.resize(size.x, size.y);
        this.redraw(true);
    };
    Map.prototype.pointLocation = function (point) {
        if (typeof point === "undefined") { point = null; }
        var coord = this.grid.pointCoordinate(point ? point : this.grid.center);
        return this.projection.coordinateLocation(coord);
    };
    Map.prototype.locationPoint = function (loc) {
        var coord = this.projection.locationCoordinate(loc);
        return this.grid.coordinatePoint(coord);
    };
    Map.prototype.onMoved = function (callback) {
        var map = this, before = this.moved_callback;
        this.moved_callback = function () {
            if(before) {
                before();
            }
            callback(map);
        };
    };
    Map.prototype.redraw = function (moved) {
        var tiles = this.grid.visibleTiles(), join = this.selection.selectAll('img.tile').data(tiles, tile_key);
        join.exit().each(this.tile_dequeuer).remove();
        join.enter().append('img').attr('class', 'tile').attr('id', tile_key).style('z-index', tile_zoom).on('load', this.tile_onloaded).each(this.tile_queuer);
        if(Tile.transform_property) {
            this.selection.selectAll('img.tile').style(Tile.transform_property, tile_xform);
        } else {
            this.selection.selectAll('img.tile').style('left', tile_left).style('top', tile_top).style('width', tile_width).style('height', tile_height);
        }
        if(moved && this.moved_callback) {
            this.moved_callback();
        }
        this.queue.process();
    };
    Map.prototype.getTileOnloaded = function () {
        var map = this;
        return function (tile, i) {
            map.loaded_tiles[this.src] = Date.now();
            map.queue.close(this);
            map.redraw(false);
        };
    };
    Map.prototype.getTileQueuer = function () {
        var map = this;
        return function (tile, i) {
            var src = map.template;
            src = src.replace('{z}', '{Z}').replace('{Z}', tile.coord.zoom.toFixed(0));
            src = src.replace('{x}', '{X}').replace('{X}', tile.coord.column.toFixed(0));
            src = src.replace('{y}', '{Y}').replace('{Y}', tile.coord.row.toFixed(0));
            map.queue.append(this, src);
        };
    };
    Map.prototype.getTileDequeuer = function () {
        var queue = this.queue;
        return function (tile, i) {
            queue.cancel(this);
        };
    };
    return Map;
})();
exports.Map = Map;
var Queue = (function () {
    function Queue(loaded_tiles) {
        this.queue = [];
        this.queue_by_id = {
        };
        this.open_request_count = 0;
        this.requests_by_id = {
        };
        this.loaded_tiles = loaded_tiles;
    }
    Queue.prototype.append = function (image, src) {
        if(src in this.loaded_tiles) {
            image.src = src;
        } else {
            var request = new Request(image, src);
            this.queue.push(request);
            this.queue_by_id[request.id] = request;
        }
    };
    Queue.prototype.cancel = function (image) {
        this.close(image);
        var request = this.queue_by_id[image.id];
        if(request) {
            request.deny();
            delete this.queue_by_id[image.id];
        }
    };
    Queue.prototype.close = function (image) {
        var request = this.requests_by_id[image.id];
        if(request) {
            request.deny();
            delete this.requests_by_id[image.id];
            this.open_request_count--;
        }
    };
    Queue.prototype.process = function () {
        this.queue.sort(Request.compare);
        while(this.open_request_count < 8 && this.queue.length > 0) {
            var request = this.queue.shift(), loading = request.load();
            if(loading) {
                this.requests_by_id[request.id] = request;
                this.open_request_count++;
            }
            delete this.queue_by_id[request.id];
        }
    };
    return Queue;
})();
var Request = (function () {
    function Request(image, src) {
        this.id = image.id;
        this.sort = parseInt(d3.select(image).style('z-index'));
        this.image = image;
        this.src = src;
    }
    Request.prototype.deny = function () {
        this.image = null;
    };
    Request.prototype.load = function () {
        if(this.image && this.image.parentNode) {
            this.image.src = this.src;
            return true;
        }
        return false;
    };
    Request.compare = function compare(a, b) {
        return b.sort - a.sort;
    };
    return Request;
})();
function tile_key(tile) {
    return tile.toKey();
}
function tile_left(tile) {
    return tile.left();
}
function tile_top(tile) {
    return tile.top();
}
function tile_width(tile) {
    return tile.width();
}
function tile_height(tile) {
    return tile.height();
}
function tile_xform(tile) {
    return tile.transform();
}
function tile_zoom(tile) {
    return tile.coord.zoom;
}

});

require.define("/Mouse.js",function(require,module,exports,__dirname,__filename,process,global){
var Core = require("./Core")

function element_size(element) {
    if(element == document.body) {
        return new Core.Point(window.innerWidth, window.innerHeight);
    }
    return new Core.Point(element.clientWidth, element.clientHeight);
}
exports.element_size = element_size;
function link_control(selection, control) {
    var zoombox = selection.append('div'), zoomout = add_button(zoombox), zoom_in = add_button(zoombox);
    zoomout.style('margin-right', '5px');
    zoombox.style('z-index', 99).style('position', 'absolute').style('padding', '5px').style('margin', '5px').style('background-color', 'rgba(0, 0, 0, .2)').style('border-radius', '6px');
    var png_prefix = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJAQMAAADaX5RTAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAAAA////pdmf3QAAAAJ0Uk5T/wDltzBKAAAAEUlEQVQI12', png_suffix = 'AAAAASUVORK5CYII=';
    zoom_in.append('img').style('display', 'block').style('pointer-events', 'none').attr('src', png_prefix + 'N43MAAQXAAEwEAcZcIUxqnpLs' + png_suffix);
    zoomout.append('img').style('display', 'block').style('pointer-events', 'none').attr('src', png_prefix + 'P438AAQXAAEwEAescI+0eupfw' + png_suffix);
    selection.on('dblclick.map', function () {
        control.onDoubleclick();
    });
    selection.on('mousedown.map', function () {
        control.onMousedown();
    });
    selection.on('mousewheel.map', function () {
        control.onMousewheel();
    });
    selection.on('DOMMouseScroll.map', function () {
        control.onMousewheel();
    });
    zoom_in.on('click.in', function () {
        control.onZoomin();
    }).on('dblclick.in', smother_event);
    zoomout.on('click.out', function () {
        control.onZoomout();
    }).on('dblclick.out', smother_event);
}
exports.link_control = link_control;
function add_button(parent) {
    var button = parent.append('a');
    button.style('display', 'block').style('float', 'left').style('cursor', 'pointer').style('padding', '7px').style('border-radius', '3px').style('background-color', 'white').style('opacity', 0.8).on('mouseover.button', function () {
        button.style('opacity', 1);
    }).on('mouseout.button', function () {
        button.style('opacity', 0.8);
    });
    return button;
}
function smother_event() {
    d3.event.preventDefault();
    d3.event.stopPropagation();
}
var Control = (function () {
    function Control(map, whole_zooms) {
        this.map = map;
        this.whole_zooms = whole_zooms;
    }
    Control.prototype.nextZoomIn = function () {
        var zoom = this.map.grid.zoom() + 1;
        return this.whole_zooms ? Math.round(zoom) : zoom;
    };
    Control.prototype.nextZoomOut = function () {
        var zoom = this.map.grid.zoom() - 1;
        return this.whole_zooms ? Math.round(zoom) : zoom;
    };
    Control.prototype.onZoomin = function () {
        this.map.grid.zoomToAbout(this.nextZoomIn(), this.map.grid.center);
        this.map.redraw(true);
        smother_event();
    };
    Control.prototype.onZoomout = function () {
        this.map.grid.zoomToAbout(this.nextZoomOut(), this.map.grid.center);
        this.map.redraw(true);
        smother_event();
    };
    Control.prototype.onDoubleclick = function () {
        var mouse = d3.mouse(this.map.parent), anchor = new Core.Point(mouse[0], mouse[1]), target = d3.event.shiftKey ? this.nextZoomOut() : this.nextZoomIn();
        this.map.grid.zoomToAbout(target, anchor);
        this.map.redraw(true);
    };
    Control.prototype.onMousedown = function () {
        var control = this, start_mouse = new Core.Point(d3.event.pageX, d3.event.pageY);
        d3.select(window).on('mousemove.map', this.getOnMousemove(start_mouse)).on('mouseup.map', function () {
            control.onMouseup();
        });
        smother_event();
    };
    Control.prototype.onMouseup = function () {
        d3.select(window).on('mousemove.map', null).on('mouseup.map', null);
    };
    Control.prototype.getOnMousemove = function (start) {
        var map = this.map, prev = start;
        return function () {
            var curr = new Core.Point(d3.event.pageX, d3.event.pageY), dx = curr.x - prev.x, dy = curr.y - prev.y;
            map.grid.panBy(dx, dy);
            map.redraw(true);
            prev = curr;
        };
    };
    Control.prototype.onMousewheel = function () {
        var mouse = d3.mouse(this.map.parent), anchor = new Core.Point(mouse[0], mouse[1]), target = this.map.grid.zoom() + this.d3_behavior_zoom_delta();
        this.map.grid.zoomToAbout(target, anchor);
        this.map.redraw(true);
        smother_event();
    };
    Control.prototype.d3_behavior_zoom_delta = function () {
        if(!this.d3_behavior_zoom_div) {
            this.d3_behavior_zoom_div = d3.select("body").append("div").style("visibility", "hidden").style("top", 0).style("height", 0).style("width", 0).style("overflow-y", "scroll").append("div").style("height", "2000px").node().parentNode;
        }
        try  {
            this.d3_behavior_zoom_div['scrollTop'] = 250;
            this.d3_behavior_zoom_div.dispatchEvent(d3.event);
            var delta = 250 - this.d3_behavior_zoom_div['scrollTop'];
        } catch (error) {
            var delta = d3.event.wheelDelta || (-d3.event.detail * 5);
        }
        return delta * 0.003;
    };
    return Control;
})();
exports.Control = Control;

});

require.define("/Core.js",function(require,module,exports,__dirname,__filename,process,global){var Point = (function () {
    function Point(x, y) {
        this.x = x;
        this.y = y;
    }
    Point.prototype.toString = function () {
        return "(" + this.x.toFixed(3) + ", " + this.y.toFixed(3) + ")";
    };
    return Point;
})();
exports.Point = Point;
var Coordinate = (function () {
    function Coordinate(row, column, zoom) {
        this.row = row;
        this.column = column;
        this.zoom = zoom;
    }
    Coordinate.prototype.toString = function () {
        return "(" + this.row.toFixed(3) + ", " + this.column.toFixed(3) + " @" + this.zoom.toFixed(3) + ")";
    };
    Coordinate.prototype.copy = function () {
        return new Coordinate(this.row, this.column, this.zoom);
    };
    Coordinate.prototype.container = function () {
        var coord = this.zoomTo(Math.floor(this.zoom));
        return new Coordinate(Math.floor(coord.row), Math.floor(coord.column), coord.zoom);
    };
    Coordinate.prototype.zoomTo = function (destination) {
        var power = Math.pow(2, destination - this.zoom);
        return new Coordinate(this.row * power, this.column * power, destination);
    };
    Coordinate.prototype.zoomBy = function (distance) {
        var power = Math.pow(2, distance);
        return new Coordinate(this.row * power, this.column * power, this.zoom + distance);
    };
    Coordinate.prototype.up = function (distance) {
        if (typeof distance === "undefined") { distance = 1; }
        return new Coordinate(this.row - distance, this.column, this.zoom);
    };
    Coordinate.prototype.right = function (distance) {
        if (typeof distance === "undefined") { distance = 1; }
        return new Coordinate(this.row, this.column + distance, this.zoom);
    };
    Coordinate.prototype.down = function (distance) {
        if (typeof distance === "undefined") { distance = 1; }
        return new Coordinate(this.row + distance, this.column, this.zoom);
    };
    Coordinate.prototype.left = function (distance) {
        if (typeof distance === "undefined") { distance = 1; }
        return new Coordinate(this.row, this.column - distance, this.zoom);
    };
    return Coordinate;
})();
exports.Coordinate = Coordinate;

});

require.define("/Base.js",function(require,module,exports,__dirname,__filename,process,global){



});

require.define("/Tile.js",function(require,module,exports,__dirname,__filename,process,global){
var Grid = require("./Grid")
var Tile = (function () {
    function Tile(coordinate, grid) {
        this.coord = coordinate;
        this.grid = grid;
    }
    Tile.prototype.toString = function () {
        return [
            this.coord.toString(), 
            this.left(), 
            this.top()
        ].join(' ');
    };
    Tile.prototype.toKey = function () {
        return [
            Math.floor(this.coord.zoom), 
            Math.floor(this.coord.column), 
            Math.floor(this.coord.row)
        ].join('/');
    };
    Tile.prototype.left = function () {
        var point = this.grid.coordinatePoint(this.coord.container());
        return Math.round(point.x) + 'px';
    };
    Tile.prototype.top = function () {
        var point = this.grid.coordinatePoint(this.coord.container());
        return Math.round(point.y) + 'px';
    };
    Tile.prototype.width = function () {
        var scale = Math.pow(2, this.grid.zoom() - this.coord.zoom);
        return Math.ceil(scale * Grid.TileSize) + 'px';
    };
    Tile.prototype.height = function () {
        var scale = Math.pow(2, this.grid.zoom() - this.coord.zoom);
        return Math.ceil(scale * Grid.TileSize) + 'px';
    };
    Tile.prototype.transform = function () {
        var scale = Math.pow(2, this.grid.zoom() - this.coord.zoom);
        if(scale * Grid.TileSize % 1) {
            scale += (1 - scale * Grid.TileSize % 1) / Grid.TileSize;
        }
        var zoomedCoord = this.grid.roundCoord().zoomBy(this.coord.zoom - this.grid.roundCoord().zoom), x = Math.round(this.grid.center.x + (this.coord.column - zoomedCoord.column) * Grid.TileSize * scale), y = Math.round(this.grid.center.y + (this.coord.row - zoomedCoord.row) * Grid.TileSize * scale);
        return matrix_string(scale, x, y, Grid.TileSize / 2.0, Grid.TileSize / 2.0);
    };
    return Tile;
})();
exports.Tile = Tile;
exports.transform_property = null;
if('transform' in document.documentElement.style) {
    exports.transform_property = 'transform';
} else if('-webkit-transform' in document.documentElement.style) {
    exports.transform_property = '-webkit-transform';
} else if('-o-transform' in document.documentElement.style) {
    exports.transform_property = '-o-transform';
} else if('-moz-transform' in document.documentElement.style) {
    exports.transform_property = '-moz-transform';
} else if('-ms-transform' in document.documentElement.style) {
    exports.transform_property = '-ms-transform';
}
function matrix_string(scale, x, y, cx, cy) {
    if('WebKitCSSMatrix' in window && ('m11' in new window['WebKitCSSMatrix']())) {
        scale = scale || 1;
        return 'translate3d(' + [
            x.toFixed(0), 
            y.toFixed(0), 
            '0px'
        ].join('px,') + ') scale3d(' + [
            scale.toFixed(8), 
            scale.toFixed(8), 
            '1'
        ].join(',') + ')';
    }
    var unit = (exports.transform_property == 'MozTransform') ? 'px' : '';
    return 'matrix(' + [
        (scale || '1'), 
        0, 
        0, 
        (scale || '1'), 
        (x + ((cx * scale) - cx)) + unit, 
        (y + ((cy * scale) - cy)) + unit
    ].join(',') + ')';
}
exports.matrix_string = matrix_string;

});

require.define("/Grid.js",function(require,module,exports,__dirname,__filename,process,global){var Core = require("./Core")
var Tile = require("./Tile")
exports.TileSize = 256;
exports.TileExp = Math.log(exports.TileSize) / Math.log(2);
var MinZoom = 0;
var MaxZoom = 18;
var Grid = (function () {
    function Grid(w, h, coord, pyramid) {
        this.resize(w, h);
        this.coord = coord;
        this.pyramid = pyramid;
    }
    Grid.prototype.zoom = function () {
        return this.coord.zoom;
    };
    Grid.prototype.roundCoord = function () {
        return this.coord.zoomTo(Math.round(this.coord.zoom));
    };
    Grid.prototype.resize = function (w, h) {
        this.center = new Core.Point(w / 2, h / 2);
    };
    Grid.prototype.panBy = function (x, y) {
        var new_center = new Core.Point(this.center.x - x, this.center.y - y);
        this.coord = this.pointCoordinate(new_center);
    };
    Grid.prototype.zoomToAbout = function (zoom, anchor) {
        var offset = new Core.Point(this.center.x * 2 - anchor.x, this.center.y * 2 - anchor.y), coord = this.pointCoordinate(new Core.Point(anchor.x, anchor.y));
        this.coord = coord;
        this.coord = this.coord.zoomTo(zoom);
        if(this.coord.zoom > MaxZoom) {
            this.coord = this.coord.zoomTo(MaxZoom);
        } else if(this.coord.zoom < MinZoom) {
            this.coord = this.coord.zoomTo(MinZoom);
        }
        this.coord = this.pointCoordinate(offset);
    };
    Grid.prototype.coordinatePoint = function (coord) {
        var pixel_center = this.coord.zoomBy(exports.TileExp), pixel_coord = coord.zoomTo(pixel_center.zoom), x = this.center.x - pixel_center.column + pixel_coord.column, y = this.center.y - pixel_center.row + pixel_coord.row;
        return new Core.Point(x, y);
    };
    Grid.prototype.pointCoordinate = function (point) {
        var x = point.x - this.center.x, y = point.y - this.center.y, pixel_center = this.coord.zoomBy(exports.TileExp), pixel_coord = pixel_center.right(x).down(y);
        return pixel_coord.zoomTo(this.coord.zoom);
    };
    Grid.prototype.visibleTiles = function () {
        var round_coord = this.roundCoord(), tl = this.pointCoordinate(new Core.Point(0, 0)), br = this.pointCoordinate(new Core.Point(this.center.x * 2, this.center.y * 2));
        tl = tl.zoomTo(round_coord.zoom).container();
        br = br.zoomTo(round_coord.zoom).container();
        var tiles = [], parents = {
        };
        for(var i = tl.row; i <= br.row; i++) {
            for(var j = tl.column; j <= br.column; j++) {
                var coord = new Core.Coordinate(i, j, round_coord.zoom);
                tiles.push(new Tile.Tile(coord, this));
                for(var k = coord.zoom - 1; k >= coord.zoom - this.pyramid && k >= 0; k--) {
                    var parent = coord.zoomTo(k).container();
                    if(parent.toString() in parents) {
                        break;
                    }
                    parents[parent.toString()] = true;
                    tiles.push(new Tile.Tile(parent, this));
                }
            }
        }
        return tiles;
    };
    return Grid;
})();
exports.Grid = Grid;

});

require.define("/Div.js",function(require,module,exports,__dirname,__filename,process,global){var Mouse = require("./Mouse")
var Base = require("./Base")

var Grid = require("./Grid")


var Map = (function () {
    function Map(parent, proj, loc, zoom) {
        this.selection = d3.select(parent);
        this.parent = parent;
        Mouse.link_control(this.selection, new Mouse.Control(this, false));
        var size = Mouse.element_size(this.parent), coord = proj.locationCoordinate(loc).zoomTo(zoom);
        this.grid = new Grid.Grid(size.x, size.y, coord, 0);
        this.projection = proj;
        var map = this;
        d3.select(window).on('resize.map', function () {
            map.update_gridsize();
        });
        this.selection.selectAll('div.tile').remove();
        this.redraw(false);
    }
    Map.prototype.update_gridsize = function () {
        var size = Mouse.element_size(this.parent);
        this.grid.resize(size.x, size.y);
        this.redraw(true);
    };
    Map.prototype.pointLocation = function (point) {
        if (typeof point === "undefined") { point = null; }
        var coord = this.grid.pointCoordinate(point ? point : this.grid.center);
        return this.projection.coordinateLocation(coord);
    };
    Map.prototype.locationPoint = function (loc) {
        var coord = this.projection.locationCoordinate(loc);
        return this.grid.coordinatePoint(coord);
    };
    Map.prototype.onMoved = function (callback) {
        var map = this, before = this.moved_callback;
        this.moved_callback = function () {
            if(before) {
                before();
            }
            callback(map);
        };
    };
    Map.prototype.redraw = function (moved) {
        var tiles = this.grid.visibleTiles(), join = this.selection.selectAll('div.tile').data(tiles, tile_key);
        join.exit().remove();
        join.enter().append('div').attr('class', 'tile').style('border-top', '1px solid pink').style('border-left', '1px solid pink').text(tile_key).attr('id', tile_key);
        this.selection.selectAll('div.tile').style('left', tile_left).style('top', tile_top).style('width', tile_width).style('height', tile_height);
        if(moved && this.moved_callback) {
            this.moved_callback();
        }
    };
    return Map;
})();
exports.Map = Map;
function tile_key(tile) {
    return tile.toKey();
}
function tile_left(tile) {
    return tile.left();
}
function tile_top(tile) {
    return tile.top();
}
function tile_width(tile) {
    return tile.width();
}
function tile_height(tile) {
    return tile.height();
}
function tile_xform(tile) {
    return tile.transform();
}

});

require.define("/Geo.js",function(require,module,exports,__dirname,__filename,process,global){var Core = require("./Core")
var Location = (function () {
    function Location(lat, lon) {
        this.lat = lat;
        this.lon = lon;
    }
    Location.prototype.toString = function () {
        return "(" + this.lat.toFixed(6) + ", " + this.lon.toFixed(6) + ")";
    };
    return Location;
})();
exports.Location = Location;
var π = Math.PI;
var Mercator = (function () {
    function Mercator() {
    }
    Mercator.prototype.project = function (loc) {
        var λ = π * loc.lon / 180, φ = π * loc.lat / 180;
        var x = λ, y = Math.log(Math.tan(π / 4 + φ / 2));
        return new Core.Point(x, y);
    };
    Mercator.prototype.inverse = function (point) {
        var λ = point.x, φ = 2 * Math.atan(Math.exp(point.y)) - π / 2;
        var lat = 180 * φ / π, lon = 180 * λ / π;
        return new Location(lat, lon);
    };
    Mercator.prototype.locationCoordinate = function (loc, zoom) {
        if (typeof zoom === "undefined") { zoom = 0; }
        var p = this.project(loc), col = (p.x + π) / (2 * π), row = (π - p.y) / (2 * π);
        return new Core.Coordinate(row, col, 0).zoomTo(zoom);
    };
    Mercator.prototype.coordinateLocation = function (coord) {
        var coord = coord.zoomTo(0), x = (coord.column * 2 * π) - π, y = π - (coord.row * 2 * π);
        return this.inverse(new Core.Point(x, y));
    };
    return Mercator;
})();
exports.Mercator = Mercator;

});

require.define("/Map.js",function(require,module,exports,__dirname,__filename,process,global){var Image = require("./Image")
var Div = require("./Div")
var Geo = require("./Geo")
var sorry_docbody_safari5 = 'Sorry, for the moment I can’t figure out how to make the mousewheel work in Safari 5.0 when the parent element is the document body. Try making your parent element a DIV?';
function makeImgMap(parent, template, lat, lon, zoom) {
    if(parent == document.body) {
        throw Error(sorry_docbody_safari5);
    }
    return new Image.Map(parent, template, new Geo.Mercator(), new Geo.Location(lat, lon), zoom);
}
function makeDivMap(parent, lat, lon, zoom) {
    if(parent == document.body) {
        throw Error(sorry_docbody_safari5);
    }
    return new Div.Map(parent, new Geo.Mercator(), new Geo.Location(lat, lon), zoom);
}
window['pocketsquares'] = {
    makeImgMap: makeImgMap,
    makeDivMap: makeDivMap,
    Geo: {
        Mercator: Geo.Mercator
    }
};
if(window['ps'] == undefined) {
    window['ps'] = window['pocketsquares'];
}

});
require("/Map.js");
