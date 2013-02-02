///<reference path="d3types.ts" />
import Queue = module('Queue');
import Mouse = module('Mouse');
import Core = module('Core');
import Tile = module('Tile');
import Grid = module('Grid');

class Map implements Mouse.Map
{
    public grid:Grid.Grid;
    public parent:HTMLElement;

    private queue:Queue.Queue;
    private mouse_ctrl:Mouse.Control;
    private selection:ID3Selection;
    private loaded_tiles:Object;
    
    // functions called for each image tile as it enters/exits the map.
    private tile_queuer:(tile:Tile.Tile, index:number)=>void;
    private tile_dequeuer:(tile:Tile.Tile, index:number)=>void;
    private tile_onloaded:(tile:Tile.Tile, index:number)=>void;
    
    constructor(parent:HTMLElement)
    {
        this.mouse_ctrl = new Mouse.Control(this);
        this.selection = d3.select('#'+parent.id);
        this.loaded_tiles = {};
        this.parent = parent;
        
        var center = new Core.Point(this.parent.clientWidth/2, this.parent.clientHeight/2);
        
        this.grid = new Grid.Grid(center);
        this.grid.coord = new Core.Coordinate(.5, .5, 0).zoomTo(3.4);
        
        this.queue = new Queue.Queue(this.loaded_tiles);
        this.tile_queuer = this.getTileQueuer();
        this.tile_dequeuer = this.getTileDequeuer();
        this.tile_onloaded = this.getTileOnloaded();
        
        var mouse_ctrl = this.mouse_ctrl;
        
        this.selection
            .on('mousedown.map', function() { mouse_ctrl.onMousedown() })
            .on('mousewheel.map', function() { mouse_ctrl.onMousewheel() })
            .on('DOMMouseScroll.map', function() { mouse_ctrl.onMousewheel() });
    }
    
    public zoom():number
    {
        return this.grid.coord.zoom;
    }
    
    public redraw():void
    {
        var tiles = this.grid.visible_tiles(),
            join = this.selection.selectAll('img').data(tiles, Map.tile_key);
        
        join.exit()
            .each(this.tile_dequeuer)
            .remove();

        join.enter()
            .append('img')
            .attr('id', Map.tile_key)
            .on('load', this.tile_onloaded)
            .each(this.tile_queuer);
        
        if(Tile.transform_property) {
            // Use CSS transforms if available.
            this.selection.selectAll('img')
                .style(Tile.transform_property, Map.tile_xform);

        } else {
            this.selection.selectAll('img')
                .style('left', Map.tile_left)
                .style('top', Map.tile_top)
                .style('width', Map.tile_width)
                .style('height', Map.tile_height);
        }
        
        this.queue.process();
    }
    
    public static tile_key   (tile:Tile.Tile):string { return tile.toKey()     }
    public static tile_left  (tile:Tile.Tile):string { return tile.left()      }
    public static tile_top   (tile:Tile.Tile):string { return tile.top()       }
    public static tile_width (tile:Tile.Tile):string { return tile.width()     }
    public static tile_height(tile:Tile.Tile):string { return tile.height()    }
    public static tile_xform (tile:Tile.Tile):string { return tile.transform() }
    
   /**
    * Return a function usable in d3...on('load', ...).
    */
    private getTileOnloaded():(tile:Tile.Tile, i:number)=>void
    {
        var map = this;
        
       /**
        * The specified listener is invoked in the same manner as other
        * operator functions, being passed the current datum `tile` and
        * index `i`, with the `this` context as the current DOM element.
        *
        * https://github.com/mbostock/d3/wiki/Selections#wiki-on
        */
        return function(tile:Tile.Tile, i:number)
        {
            map.loaded_tiles[this.src] = Date.now();
            map.queue.close(this);
            map.redraw();
        }
    }
    
   /**
    * Return a function usable in d3.select().each().
    */
    private getTileQueuer():(tile:Tile.Tile, i:number)=>void
    {
        var queue = this.queue;
        
       /**
        * Invokes the specified function for each element in the current
        * selection, passing in the current datum `tile` and index `i`,
        * with the `this` context of the current DOM element.
        *
        * https://github.com/mbostock/d3/wiki/Selections#wiki-each
        */
        return function(tile:Tile.Tile, i:number)
        {
            var src = 'http://otile1.mqcdn.com/tiles/1.0.0/osm/' + tile.toKey() + '.jpg';
            queue.append(this, src);
        }
    }
    
   /**
    * Return a function usable in d3.select().each().
    */
    private getTileDequeuer():(tile:Tile.Tile, i:number)=>void
    {
        var queue = this.queue;
        
       /**
        * Invokes the specified function for each element in the current
        * selection, passing in the current datum `tile` and index `i`,
        * with the `this` context of the current DOM element.
        *
        * https://github.com/mbostock/d3/wiki/Selections#wiki-each
        */
        return function(tile:Tile.Tile, i:number)
        {
            queue.cancel(this);
        }
    }
}

function makeMap(parent:HTMLElement):Map
{
    return new Map(parent);
}

window['makeMap'] = makeMap;
