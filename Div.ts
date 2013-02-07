///<reference path="d3types.ts" />
import Mouse = module('Mouse');
import Base = module('Base');
import Core = module('Core');
import Grid = module('Grid');
import Tile = module('Tile');

export class Map implements Base.Map
{
    public grid:Grid.Grid;
    public parent:HTMLElement;

    private mouse_ctrl:Mouse.Control;
    private selection:ID3Selection;

    constructor(parent:HTMLElement, row:number, column:number, zoom:number)
    {
        this.mouse_ctrl = new Mouse.Control(this);
        this.selection = d3.select(parent);
        this.parent = parent;
        
        var size = Mouse.element_size(this.parent);
        this.grid = new Grid.Grid(size.x, size.y, 0);
        this.grid.coord = new Core.Coordinate(row, column, zoom);
        
        var mouse_ctrl = this.mouse_ctrl,
            map = this;
        
        this.selection
            .on('dblclick.map', function() { mouse_ctrl.onDoubleclick() })
            .on('mousedown.map', function() { mouse_ctrl.onMousedown() })
            .on('mousewheel.map', function() { mouse_ctrl.onMousewheel() })
            .on('DOMMouseScroll.map', function() { mouse_ctrl.onMousewheel() });
        
        d3.select(window).on('resize.map', function() { map.update_gridsize() });
    }
    
    private update_gridsize():void
    {
        var size = Mouse.element_size(this.parent);
        this.grid.resize(size.x, size.y);
        this.redraw();
    }
    
    public redraw():void
    {
        var tiles = this.grid.visible_tiles(),
            join = this.selection.selectAll('div.tile').data(tiles, Map.tile_key);
        
        join.exit()
            .remove();

        join.enter()
            .append('div')
            .attr('class', 'tile')
            .style('border-top', '1px solid pink')
            .style('border-left', '1px solid pink')
            .text(Map.tile_key)
            .attr('id', Map.tile_key);
        
        this.selection.selectAll('div.tile')
            .style('left', Map.tile_left)
            .style('top', Map.tile_top)
            .style('width', Map.tile_width)
            .style('height', Map.tile_height);
    }
    
    public static tile_key   (tile:Tile.Tile):string { return tile.toKey()     }
    public static tile_left  (tile:Tile.Tile):string { return tile.left()      }
    public static tile_top   (tile:Tile.Tile):string { return tile.top()       }
    public static tile_width (tile:Tile.Tile):string { return tile.width()     }
    public static tile_height(tile:Tile.Tile):string { return tile.height()    }
    public static tile_xform (tile:Tile.Tile):string { return tile.transform() }
}