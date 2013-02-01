///<reference path="d3types.ts" />
import Core = module('Core');
import Tile = module('Tile');
import Map = module('Map');

class Grid
{
    private selection:ID3Selection;
    private parent:Element;
    private map:Map.Map;
    
    // secret div used in d3_behavior_zoom_delta to correct mouse wheel speed.
    private d3_behavior_zoom_div:Node;
    
    constructor(id:string)
    {
        this.selection = d3.select('#'+id);
        this.parent = document.getElementById(id);
        
        var center = new Core.Point(this.parent.clientWidth/2, this.parent.clientHeight/2);
        
        this.map = new Map.Map(center);
        this.map.coord = new Core.Coordinate(.5, .5, 0).zoomTo(3.4);
        
        var grid = this;
        
        this.selection
            .on('mousedown.map', function() { grid.onMousedown() })
            .on('mousewheel.map', function() { grid.onMousewheel() })
            .on('DOMMouseScroll.map', function() { grid.onMousewheel() });
    }
    
    public redraw():void
    {
        var tiles = this.map.visible_tiles(),
            join = this.selection.selectAll('img').data(tiles, Grid.tile_key);
        
        join.exit()
            .remove();

        join.enter()
            .append('img')
            .attr('src', function(tile) { return 'http://otile1.mqcdn.com/tiles/1.0.0/osm/' + tile.toKey() + '.jpg' });
        
        this.selection.selectAll('img')
            .style('left', Grid.tile_left)
            .style('top', Grid.tile_top)
            .style('width', Grid.tile_width)
            .style('height', Grid.tile_height);
            
    }
    
    public static tile_key   (tile:Tile.Tile):string { return tile.toKey()  }
    public static tile_left  (tile:Tile.Tile):string { return tile.left()   }
    public static tile_top   (tile:Tile.Tile):string { return tile.top()    }
    public static tile_width (tile:Tile.Tile):string { return tile.width()  }
    public static tile_height(tile:Tile.Tile):string { return tile.height() }
    
    public onMousedown():void
    {
        var grid = this,
            start_mouse = new Core.Point(d3.event.pageX, d3.event.pageY);

        d3.select(window)
            .on('mousemove.map', this.getOnMousemove(start_mouse))
            .on('mouseup.map', function() { grid.onMouseup() })

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
        var grid = this,
            prev = start;
    
        return function()
        {
            var curr = new Core.Point(d3.event.pageX, d3.event.pageY),
                diff = new Core.Point(curr.x - prev.x, curr.y - prev.y);            

            grid.map.panBy(diff);
            grid.redraw();
            // d3.timer(redraw);
            
            prev = curr;
        }
    }
    
    public onMousewheel():void
    {
        // 18 = max zoom, 0 = min zoom
        var delta = Math.min(18 - this.map.coord.zoom, Math.max(0 - this.map.coord.zoom, this.d3_behavior_zoom_delta()));

        if(delta != 0)
        {
            var mouse = d3.mouse(this.parent),
                anchor = new Core.Point(mouse[0], mouse[1]);
            
            this.map.zoomByAbout(delta, anchor);
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

function makeMap(id:string):Grid
{
    return new Grid(id);
}

window['makeMap'] = makeMap;
