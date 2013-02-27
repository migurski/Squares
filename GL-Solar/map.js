// 
// Sample Map class for use with Squares.
// Implements the Map interface from v0.0.5:
// https://github.com/migurski/Squares/blob/315e37bc/src/Base.ts
// 
// Renders data with WebGL, and relies on Web Worker in feature-arrayer.js
// and global ctx variable from get_webgl_context() in index.html.
// 

function Map(parent, proj, loc, zoom)
{
    this.queue = new Queue();
    this.timeout = false;
    this.worker = new Worker('feature-arrayer.js');

    this.selection = d3.select(parent);
    this.parent = parent;

    var size = sq.Mouse.element_size(this.parent), coord = proj.locationCoordinate(loc).zoomTo(zoom);
    this.grid = new sq.Grid.Grid(size.x, size.y, coord, 0);
    this.projection = proj;

    sq.Mouse.link_control(this.selection, new sq.Mouse.Control(this, false));
    sq.Hash.link_control(this);

    var map = this;
    d3.select(window).on('resize.map', function() { map.update_gridsize() });
    
    this.worker.addEventListener('message', function(e) { map.new_data(e.data.node_id, e.data.list, e.data.elapsed) }, false);

    this.selection.selectAll('div.tile').remove();
    this.redraw(false);
}

Map.prototype = {

    update_gridsize: function()
    {
        var size = sq.Mouse.element_size(this.parent);
        this.grid.resize(size.x, size.y);
    },

    pointLocation: function(point)
    {
        var coord = this.grid.pointCoordinate(point ? point : this.grid.center);
        return this.projection.coordinateLocation(coord);
    },

    locationPoint: function(loc)
    {
        var coord = this.projection.locationCoordinate(loc);
        return this.grid.coordinatePoint(coord);
    },

    setCenterZoom: function(loc, zoom)
    {
        this.grid.setCenter(this.projection.locationCoordinate(loc, zoom));
        this.redraw(true);
    },
    
    onMoved: function(callback)
    {
        this.moved_callback = callback;
    },

    redraw: function(moved)
    {
        var tiles = this.grid.visibleTiles(),
            join = this.selection.selectAll('div.tile').data(tiles, tile_key);

        var map = this;
        
        join.exit()
            .remove()
            .each(function(tile, i) { map.exit_handler(tile, this) });

        join.enter()
            .append('div')
            .attr('class', 'tile')
            .style('position', 'absolute')
            .style('margin', '0')
            .style('padding', '0')
            .style('border', '0')
            .style('-webkit-transform-origin', '0px 0px')
            .each(function(tile, i) { map.enter_handler(tile, this) });

        this.selection.selectAll('div.tile')
            .style('left', tile_left)
            .style('top', tile_top)
            .style('width', tile_width)
            .style('height', tile_height);

        if(this.moved_callback)
        {
            this.moved_callback(this);
        }
        
        this.queue.process();
        this.render();
    },
    
    update: function()
    {
        var len = 0,
            offs = [];
        
        // get the total length of all arrays
        this.selection.selectAll('div.tile')
            .each(function() { if(this.array) { len += this.array.length } });
        
        var xys = new Float32Array(len),
            off = 0;
    
        // concatenate all arrays to xys
        this.selection.selectAll('div.tile')
            .each(function() { if(this.array) { xys.set(this.array, off); offs.push(off); off += this.array.length } });
        
        ctx.data(xys);
        
        var map = this;
        
        if(map.timeout) {
            clearTimeout(map.timeout);
        }
        
        map.timeout = setTimeout(function() { map.redraw() }, 100);
    },
    
    render: function()
    {
        var keys = [];
        
        for(var key in this.arrays)
        {
            keys.push(key);
        }
        
        var size = sq.Mouse.element_size(this.parent),
            nw = this.pointLocation({x: 0, y: 0}),
            se = this.pointLocation(size),
            ul = this.projection.project(nw),
            lr = this.projection.project(se);
        
        ctx.draw(size, ul, lr);
    },
    
    exit_handler: function(tile, node)
    {
        this.queue.cancel(node);
        
        var map = this;
        
        if(map.timeout) {
            clearTimeout(map.timeout);
        }
        
        map.timeout = setTimeout(function() { map.update() }, 25);
    },
    
    enter_handler: function(tile, node)
    {
        if(tile.coord.zoom < 12)
        {
            return;
        }
        
        var map = this;
    
        var callback = function(data)
        {
            map.queue.close(node);
            map.worker.postMessage({node_id: node.id, features: data['features'], zoom: tile.coord.zoom});
        }
        
        node.id = this.next_int().toString();
        node.onjson = callback;
        
        this.queue.append(node, 'http://www.openstreetmap.us/~migurski/tiles/highroad/'+tile.toKey()+'.json');
    },
    
    new_data: function(node_id, list, elapsed)
    {
        var f32array = new Float32Array(list);
    
        this.selection.selectAll('div.tile')
            .each(function() { if(this.id == node_id) { this.array = f32array } });
        
        var map = this;
        
        if(map.timeout) {
            clearTimeout(map.timeout);
        }
        
        map.timeout = setTimeout(function() { map.update() }, 25);
    },
    
    next_int: function()
    {
        if(this.number == undefined)
        {
            this.number = 0;
        }
        
        return ++this.number;
    }
}

function tile_key(tile) {    return tile.toKey()     }
function tile_left(tile) {   return tile.left()      }
function tile_top(tile) {    return tile.top()       }
function tile_width(tile) {  return tile.width()     }
function tile_height(tile) { return tile.height()    }
function tile_xform(tile) {  return tile.transform() }
