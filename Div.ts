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
        this.selection = d3.select('#'+parent.id);
        this.parent = parent;
        
        var center = new Core.Point(this.parent.clientWidth/2, this.parent.clientHeight/2);
        
        this.grid = new Grid.Grid(center);
        this.grid.coord = new Core.Coordinate(row, column, zoom);
        
        var mouse_ctrl = this.mouse_ctrl;
        
        this.selection
            .on('mousedown.map', function() { mouse_ctrl.onMousedown() })
            .on('mousewheel.map', function() { mouse_ctrl.onMousewheel() })
            .on('DOMMouseScroll.map', function() { mouse_ctrl.onMousewheel() });
    }
    
    public redraw():void
    {
        var tiles = this.grid.visible_tiles(),
            join = this.selection.selectAll('div').data(tiles, Map.tile_key);
        
        join.exit()
            .remove();

        join.enter()
            .append('div')
            .style('border-top', '1px solid pink')
            .style('border-left', '1px solid pink')
            .text(Map.tile_key)
            .attr('id', Map.tile_key);
        
        if(false /*Tile.transform_property*/) {
            // Use CSS transforms if available.
            this.selection.selectAll('div')
                .style(Tile.transform_property, Map.tile_xform);

        } else {
            this.selection.selectAll('div')
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
}