import Core = module('Core');
import Grid = module('Grid');

export class Tile
{
    public coord:Core.Coordinate;
    public grid:Grid.Grid;
    
    constructor(coordinate:Core.Coordinate, grid:Grid.Grid)
    {
        this.coord = coordinate;
        this.grid = grid;
    }
    
    public toString():string
    {
        return [this.coord.toString(), this.left(), this.top()].join(' ');
    }
    
    public toKey():string
    {
        return [Math.floor(this.coord.zoom), Math.floor(this.coord.column), Math.floor(this.coord.row)].join('/');
    }
    
   /**
    * Return CSS left property value for a tile.
    *
    * Remove Math.round() for greater accuracy but visible seams
    */
    public left():string
    { 
        var point = this.grid.coordinatePoint(this.coord.container());
        return Math.round(point.x) + 'px'; 
    
        /*
        var scale = Math.pow(2, grid.zoom() - this.zoom()),
            power = Math.pow(2, this.zoom() - grid.roundCoord().zoom),
            centerCol = grid.roundCoord().column * power;
        return Math.round(grid.center.x + (this.coord.column - centerCol) * Grid.TileSize * scale) + 'px'; 
        */
    }

   /**
    * Return CSS top property value for a tile.
    *
    * Remove Math.round() for greater accuracy but visible seams
    */
    public top():string
    { 
        var point = this.grid.coordinatePoint(this.coord.container());
        return Math.round(point.y) + 'px'; 
    
        /*
        var scale = Math.pow(2, grid.zoom() - this.zoom()),
            power = Math.pow(2, this.zoom() - grid.roundCoord().zoom),
            centerRow = grid.roundCoord().row * power;
        return Math.round(grid.center.y + (this.coord.row - centerRow) * Grid.TileSize * scale) + 'px'; 
        */
    }

   /**
    * Return CSS width property value for a tile.
    *
    * Remove Math.ceil() for greater accuracy but visible seams
    */
    public width():string
    {
        var scale = Math.pow(2, this.grid.zoom() - this.coord.zoom);
        return Math.ceil(scale * Grid.TileSize)+'px'; 
    }

   /**
    * Return CSS height property value for a tile.
    *
    * Remove Math.ceil() for greater accuracy but visible seams
    */
    public height():string
    { 
        var scale = Math.pow(2, this.grid.zoom() - this.coord.zoom);
        return Math.ceil(scale * Grid.TileSize)+'px'; 
    }          
    
   /**
    * Return CSS transform property value for a tile.
    *
    * For 3D webkit mode
    */
    public transform():string
    {
        var scale = Math.pow(2, this.grid.zoom() - this.coord.zoom);

        // adjust to nearest whole pixel scale (thx @tmcw)
        if(scale * Grid.TileSize % 1) {
            scale += (1 - scale * Grid.TileSize % 1) / Grid.TileSize;
        }                

        var zoomedCoord = this.grid.roundCoord().zoomBy(this.coord.zoom - this.grid.roundCoord().zoom),
            x = Math.round(this.grid.center.x + (this.coord.column - zoomedCoord.column) * Grid.TileSize * scale),
            y = Math.round(this.grid.center.y + (this.coord.row - zoomedCoord.row) * Grid.TileSize * scale);

        return matrix_string(scale, x, y, Grid.TileSize/2.0, Grid.TileSize/2.0);
    }
}

export var transform_property:string = null;

if('transform' in document.documentElement.style) {
    transform_property = 'transform';

} else if('-webkit-transform' in document.documentElement.style) {
    transform_property = '-webkit-transform';

} else if('-o-transform' in document.documentElement.style) {
    transform_property = '-o-transform';

} else if('-moz-transform' in document.documentElement.style) {
    transform_property = '-moz-transform';

} else if('-ms-transform' in document.documentElement.style) {
    transform_property = '-ms-transform';
}

private matrix_string(scale:number, x:number, y:number, cx:number, cy:number):string
{
    if('WebKitCSSMatrix' in window && ('m11' in new window['WebKitCSSMatrix']()))
    {
        scale = scale || 1;
        return 'translate3d(' + [x.toFixed(0), y.toFixed(0), '0px'].join('px,') + ') scale3d(' + [scale.toFixed(8), scale.toFixed(8), '1'].join(',') + ')';
    }

    var unit = (transform_property == 'MozTransform') ? 'px' : '';

    return 'matrix(' +
        [(scale || '1'), 0, 0,
        (scale || '1'),
        (x + ((cx * scale) - cx)) + unit,
        (y + ((cy * scale) - cy)) + unit
        ].join(',') + ')';
}
