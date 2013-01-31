import Coordinate = module('Coordinate');
import Map = module('Map');

declare var matrixString:Function

export class Tile
{
    public coordinate:Coordinate.Coordinate;
    
    constructor(coordinate:Coordinate.Coordinate)
    {
        this.coordinate = coordinate;
    }
    
   /**
    * Return CSS left property value for a tile.
    *
    * Remove Math.round() for greater accuracy but visible seams
    */
    public left(map:Map.Map):string
    { 
        var scale = Math.pow(2, map.coordinate.zoom - this.coordinate.zoom),
            power = Math.pow(2, this.coordinate.zoom - map.roundCoord().zoom),
            centerCol = map.roundCoord().column * power;
        return Math.round(map.center.x + (this.coordinate.column - centerCol) * map.tilesize.x * scale) + 'px'; 
    }

   /**
    * Return CSS top property value for a tile.
    *
    * Remove Math.round() for greater accuracy but visible seams
    */
    public top(map:Map.Map):string
    { 
        var scale = Math.pow(2, map.coordinate.zoom - this.coordinate.zoom),
            power = Math.pow(2, this.coordinate.zoom - map.roundCoord().zoom),
            centerRow = map.roundCoord().row * power;
        return Math.round(map.center.y + (this.coordinate.row - centerRow) * map.tilesize.y * scale) + 'px'; 
    }

   /**
    * Return CSS width property value for a tile.
    *
    * Remove Math.ceil() for greater accuracy but visible seams
    */
    public width(map:Map.Map):string
    {
        var scale = Math.pow(2, map.coordinate.zoom - this.coordinate.zoom);
        return Math.ceil(scale * map.tilesize.x)+'px'; 
    }

   /**
    * Return CSS height property value for a tile.
    *
    * Remove Math.ceil() for greater accuracy but visible seams
    */
    public height(map:Map.Map):string
    { 
        var scale = Math.pow(2, map.coordinate.zoom - this.coordinate.zoom);
        return Math.ceil(scale * map.tilesize.y)+'px'; 
    }          
    
   /**
    * Return CSS transform property value for a tile.
    *
    * For 3D webkit mode
    */
    public transform(map:Map.Map):string
    {
        var scale = Math.pow(2, map.coordinate.zoom - this.coordinate.zoom);
        // adjust to nearest whole pixel scale (thx @tmcw)
        if (scale * map.tilesize.x % 1) {
            scale += (1 - scale * map.tilesize.x % 1) / map.tilesize.x;
        }                
        var zoomedCoord = map.roundCoord().zoomBy(this.coordinate.zoom - map.roundCoord().zoom),
            x = Math.round(map.center.x + (this.coordinate.column - zoomedCoord.column) * map.tilesize.x * scale),
            y = Math.round(map.center.y + (this.coordinate.row - zoomedCoord.row) * map.tilesize.y * scale);
        return matrixString(scale, x, y, map.tilesize.x/2.0, map.tilesize.y/2.0);
    }
}