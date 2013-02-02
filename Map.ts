///<reference path="d3types.ts" />
import Core = module('Core');
import Tile = module('Tile');
import Grid = module('Grid');

class Map
{
    private selection:ID3Selection;
    private parent:HTMLElement;
    private grid:Grid.Grid;
    
    // secret div used in d3_behavior_zoom_delta to correct mouse wheel speed.
    private d3_behavior_zoom_div:Node;
    
    // functions called for each image tile as it enters/exits the map.
    private tile_queuer:(tile:Tile.Tile, index:number)=>void;
    private tile_dequeuer:(tile:Tile.Tile, index:number)=>void;
    
    constructor(parent:HTMLElement)
    {
        this.selection = d3.select('#'+parent.id);
        this.parent = parent;
        
        var center = new Core.Point(this.parent.clientWidth/2, this.parent.clientHeight/2);
        
        this.grid = new Grid.Grid(center);
        this.grid.coord = new Core.Coordinate(.5, .5, 0).zoomTo(3.4);
        
        this.tile_queuer = this.getTileQueuer();
        this.tile_dequeuer = this.getTileDequeuer();
        
        var map = this;
        
        this.selection
            .on('mousedown.map', function() { map.onMousedown() })
            .on('mousewheel.map', function() { map.onMousewheel() })
            .on('DOMMouseScroll.map', function() { map.onMousewheel() });
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
    }
    
    public static tile_key   (tile:Tile.Tile):string { return tile.toKey()     }
    public static tile_left  (tile:Tile.Tile):string { return tile.left()      }
    public static tile_top   (tile:Tile.Tile):string { return tile.top()       }
    public static tile_width (tile:Tile.Tile):string { return tile.width()     }
    public static tile_height(tile:Tile.Tile):string { return tile.height()    }
    public static tile_xform (tile:Tile.Tile):string { return tile.transform() }
    
   /**
    * Return a function usable in d3.select().each().
    *
    * Invokes the specified function for each element in the current
    * selection, passing in the current datum `d` and index `i`, with
    * the `this` context of the current DOM element.
    *
    * https://github.com/mbostock/d3/wiki/Selections#wiki-each
    */
    private getTileQueuer():(tile:Tile.Tile, index:number)=>void
    {
        var map = this;
        
        return function(tile:Tile.Tile, index:number)
        {
            d3.select(this)
              .attr('src', 'http://otile1.mqcdn.com/tiles/1.0.0/osm/' + tile.toKey() + '.jpg');
        }
    }
    
   /**
    * Return a function usable in d3.select().each().
    *
    * Invokes the specified function for each element in the current
    * selection, passing in the current datum `d` and index `i`, with
    * the `this` context of the current DOM element.
    *
    * https://github.com/mbostock/d3/wiki/Selections#wiki-each
    */
    private getTileDequeuer():(tile:Tile.Tile, index:number)=>void
    {
        var map = this;
        
        return function(tile:Tile.Tile, index:number)
        {
            console.log('Removing', tile.toKey());
        }
    }
    
    public onMousedown():void
    {
        var map = this,
            start_mouse = new Core.Point(d3.event.pageX, d3.event.pageY);

        d3.select(window)
            .on('mousemove.map', this.getOnMousemove(start_mouse))
            .on('mouseup.map', function() { map.onMouseup() })

        d3.event.preventDefault();
        d3.event.stopPropagation();                        
    }
    
    public onMouseup():void
    {
        d3.select(window)
            .on('mousemove.map', null)
            .on('mouseup.map', null)
    }
    
    private getOnMousemove(start:Core.Point):()=>void
    {
        var map = this,
            prev = start;
    
        return function()
        {
            var curr = new Core.Point(d3.event.pageX, d3.event.pageY),
                diff = new Core.Point(curr.x - prev.x, curr.y - prev.y);            

            map.grid.panBy(diff);
            map.redraw();
            // d3.timer(redraw);
            
            prev = curr;
        }
    }
    
    public onMousewheel():void
    {
        // 18 = max zoom, 0 = min zoom
        var delta = Math.min(18 - this.grid.coord.zoom, Math.max(0 - this.grid.coord.zoom, this.d3_behavior_zoom_delta()));

        if(delta != 0)
        {
            var mouse = d3.mouse(this.parent),
                anchor = new Core.Point(mouse[0], mouse[1]);
            
            this.grid.zoomByAbout(delta, anchor);
            this.redraw();
            // d3.timer(redraw);
        }

        d3.event.preventDefault();
        d3.event.stopPropagation();                        
    }

    private d3_behavior_zoom_delta():number
    {
        //
        // mousewheel events are totally broken!
        // https://bugs.webkit.org/show_bug.cgi?id=40441
        // not only that, but Chrome and Safari differ in re. to acceleration!
        //
        if(!this.d3_behavior_zoom_div)
        {
            this.d3_behavior_zoom_div = d3
                .select("body")
                .append("div")
                  .style("visibility", "hidden")
                  .style("top", 0)
                  .style("height", 0)
                  .style("width", 0)
                  .style("overflow-y", "scroll")
                  .append("div")
                    .style("height", "2000px")
                    .node()
                    .parentNode;
        }
        
        var e = d3.event, delta;

        try {
            this.d3_behavior_zoom_div['scrollTop'] = 250;
            this.d3_behavior_zoom_div.dispatchEvent(e);
            delta = 250 - this.d3_behavior_zoom_div['scrollTop'];

        } catch (error) {
            delta = e.wheelDelta || (-e.detail * 5);
        }
        
        return delta * .005;
    }          
}

function makeMap(parent:HTMLElement):Map
{
    return new Map(parent);
}

window['makeMap'] = makeMap;
