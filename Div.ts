///<reference path="d3types.ts" />
import Mouse = module('Mouse');
import Base = module('Base');
import Core = module('Core');
import Grid = module('Grid');
import Tile = module('Tile');
import Geo = module('Geo');

export class Map implements Base.Map
{
    public grid:Grid.Grid;
    public parent:HTMLElement;

    private selection:ID3Selection;
    private projection:Geo.Mercator;
    private moved_callback:()=>void;

    constructor(parent:HTMLElement, proj:Geo.Mercator, loc:Geo.Location, zoom:number)
    {
        this.selection = d3.select(parent);
        this.parent = parent;
        
        Mouse.link_control(this.selection, new Mouse.Control(this, false));
        
        var size = Mouse.element_size(this.parent),
            coord = proj.locationCoordinate(loc).zoomTo(zoom);

        this.grid = new Grid.Grid(size.x, size.y, coord, 0);
        this.projection = proj;
        
        var map = this;
        
        d3.select(window).on('resize.map', function() { map.update_gridsize() });
        
        this.selection.selectAll('div.tile').remove();
        this.redraw(false);
    }
    
    private update_gridsize():void
    {
        var size = Mouse.element_size(this.parent);
        this.grid.resize(size.x, size.y);
        this.redraw(true);
    }
    
    public pointLocation(point:Core.Point=null):Geo.Location
    {
        var coord = this.grid.pointCoordinate(point ? point : this.grid.center);
        return this.projection.coordinateLocation(coord);
    }
    
    public locationPoint(loc:Geo.Location):Core.Point
    {
        var coord = this.projection.locationCoordinate(loc);
        return this.grid.coordinatePoint(coord);
    }
    
    public onMoved(callback:(map:Base.Map)=>void):void
    {
        var map = this,
            before = this.moved_callback;
        
        this.moved_callback = function()
        {
            if(before)
            {
                before();
            }

            callback(map);
        }
    }
    
    public redraw(moved:Boolean):void
    {
        var tiles = this.grid.visibleTiles(),
            join = this.selection.selectAll('div.tile').data(tiles, tile_key);
        
        join.exit()
            .remove();

        join.enter()
            .append('div')
            .attr('class', 'tile')
            .style('border-top', '1px solid pink')
            .style('border-left', '1px solid pink')
            .text(tile_key)
            .attr('id', tile_key);
        
        this.selection.selectAll('div.tile')
            .style('left', tile_left)
            .style('top', tile_top)
            .style('width', tile_width)
            .style('height', tile_height);
        
        if(moved && this.moved_callback)
        {
            this.moved_callback();
        }
    }
}

//
// Pile of convenience functions for use in D3 callbacks.
//
function tile_key   (tile:Tile.Tile):string { return tile.toKey()     }
function tile_left  (tile:Tile.Tile):string { return tile.left()      }
function tile_top   (tile:Tile.Tile):string { return tile.top()       }
function tile_width (tile:Tile.Tile):string { return tile.width()     }
function tile_height(tile:Tile.Tile):string { return tile.height()    }
function tile_xform (tile:Tile.Tile):string { return tile.transform() }
