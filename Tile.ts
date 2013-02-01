import Core = module('Core');
import Map = module('Map');

export class Tile
{
    public coord:Core.Coordinate;
    public map:Map.Map;
    
    constructor(coordinate:Core.Coordinate, map:Map.Map)
    {
        this.coord = coordinate;
        this.map = map;
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
        var point = this.map.coordinatePoint(this.coord.container());
        return Math.round(point.x) + 'px'; 
    
        /*
        var scale = Math.pow(2, map.coord.zoom - this.coord.zoom),
            power = Math.pow(2, this.coord.zoom - map.roundCoord().zoom),
            centerCol = map.roundCoord().column * power;
        return Math.round(map.center.x + (this.coord.column - centerCol) * Map.TileSize * scale) + 'px'; 
        */
    }

   /**
    * Return CSS top property value for a tile.
    *
    * Remove Math.round() for greater accuracy but visible seams
    */
    public top():string
    { 
        var point = this.map.coordinatePoint(this.coord.container());
        return Math.round(point.y) + 'px'; 
    
        /*
        var scale = Math.pow(2, map.coord.zoom - this.coord.zoom),
            power = Math.pow(2, this.coord.zoom - map.roundCoord().zoom),
            centerRow = map.roundCoord().row * power;
        return Math.round(map.center.y + (this.coord.row - centerRow) * Map.TileSize * scale) + 'px'; 
        */
    }

   /**
    * Return CSS width property value for a tile.
    *
    * Remove Math.ceil() for greater accuracy but visible seams
    */
    public width():string
    {
        var scale = Math.pow(2, this.map.coord.zoom - this.coord.zoom);
        return Math.ceil(scale * Map.TileSize)+'px'; 
    }

   /**
    * Return CSS height property value for a tile.
    *
    * Remove Math.ceil() for greater accuracy but visible seams
    */
    public height():string
    { 
        var scale = Math.pow(2, this.map.coord.zoom - this.coord.zoom);
        return Math.ceil(scale * Map.TileSize)+'px'; 
    }          
    
   /**
    * Return CSS transform property value for a tile.
    *
    * For 3D webkit mode
    */
    public transform():string
    {
        var scale = Math.pow(2, this.map.coord.zoom - this.coord.zoom);

        // adjust to nearest whole pixel scale (thx @tmcw)
        if(scale * Map.TileSize % 1) {
            scale += (1 - scale * Map.TileSize % 1) / Map.TileSize;
        }                

        var zoomedCoord = this.map.roundCoord().zoomBy(this.coord.zoom - this.map.roundCoord().zoom),
            x = Math.round(this.map.center.x + (this.coord.column - zoomedCoord.column) * Map.TileSize * scale),
            y = Math.round(this.map.center.y + (this.coord.row - zoomedCoord.row) * Map.TileSize * scale);

        return matrix_string(scale, x, y, Map.TileSize/2.0, Map.TileSize/2.0);
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
