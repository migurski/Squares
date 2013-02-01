///<reference path="d3types.ts" />
import Core = module('Core');
import Tile = module('Tile');
import Map = module('Map');

class Grid
{
    private selection:ID3Selection;
    private parent:Element;
    private map:Map.Map;
    
    constructor(id:string)
    {
        this.selection = d3.select('#'+id);
        this.parent = document.getElementById(id);
        
        var center = new Core.Point(this.parent.clientWidth/2, this.parent.clientHeight/2);
        
        this.map = new Map.Map(center);
        this.map.coord = new Core.Coordinate(.5, .5, 0).zoomTo(3.4);
        
        var grid = this;
        
        this.selection.on('mousedown.map', function() { grid.onMousedown() })
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
    
    public onMousedown():void
    {
        var grid = this,
            start_mouse = new Core.Point(d3.event.pageX, d3.event.pageY);

        d3.select(window)
            .on('mousemove.map', this.getOnMousemove(start_mouse))
            .on('mouseup.map', this.getOnMouseup())

        d3.event.preventDefault();
        d3.event.stopPropagation();                        
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
    
    private getOnMouseup():()=>void
    {
        var grid = this;
    
        return function()
        {
            d3.select(window)
                .on('mousemove.map', null)
                .on('mouseup.map', null);
        }
    }
    
    public static tile_key   (tile:Tile.Tile):string { return tile.toKey()  }
    public static tile_left  (tile:Tile.Tile):string { return tile.left()   }
    public static tile_top   (tile:Tile.Tile):string { return tile.top()    }
    public static tile_width (tile:Tile.Tile):string { return tile.width()  }
    public static tile_height(tile:Tile.Tile):string { return tile.height() }
}

function makeMap(id:string):Grid
{
    return new Grid(id);
}

window['makeMap'] = makeMap;
