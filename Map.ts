import Core = module('Core');
import Tile = module('Tile');

export var TileSize:number = 256;
export var TileExp:number = Math.log(TileSize) / Math.log(2);

export class Map
{
    public coord:Core.Coordinate;
    public center:Core.Point;
    
    constructor(center:Core.Point)
    {
        this.center = center;
    }
    
    public roundCoord():Core.Coordinate
    {
        return this.coord.zoomTo(Math.round(this.coord.zoom));
    }
    
    public resize(size:Core.Point):void
    {
        this.center = new Core.Point(size.x/2, size.y/2);
    }
    
   /**
    * Pan by a given x and y distance.
    */
    public panBy(diff:Core.Point):void
    {
        var new_center = new Core.Point(this.center.x - diff.x, this.center.y - diff.y);
        this.coord = this.pointCoordinate(new_center);
    }
    
   /**
    * Zoom around a given anchor point by a specified amount.
    */
    public zoomByAbout(delta:number, anchor:Core.Point):void
    {
        var offset = new Core.Point(this.center.x*2 - anchor.x, this.center.y*2 - anchor.y),
            coord = this.pointCoordinate(new Core.Point(anchor.x, anchor.y));
        
        // center the map on the wheeled-over coordinate
        this.coord = coord;
        
        // zoom the center coordinate
        this.coord = this.coord.zoomBy(delta);
        
        // move the wheeled-over coordinate back to where it was
        this.coord = this.pointCoordinate(offset);
    }
    
    public coordinatePoint(coord:Core.Coordinate):Core.Point
    {
        var pixel_center = this.coord.zoomBy(TileExp),
            pixel_coord = coord.zoomTo(pixel_center.zoom),
            x = this.center.x - pixel_center.column + pixel_coord.column,
            y = this.center.y - pixel_center.row + pixel_coord.row;
        
        return new Core.Point(x, y);
    }
    
    public pointCoordinate(point:Core.Point):Core.Coordinate
    {
        var x = point.x - this.center.x,
            y = point.y - this.center.y,
            pixel_center = this.coord.zoomBy(TileExp),
            pixel_coord = pixel_center.right(x).down(y);
        
        return pixel_coord.zoomTo(this.coord.zoom);
    }
    
   /**
    * Retrieve a list of Tile objects covering the current visible area.
    */
    public visible_tiles():Tile.Tile[]
    {
        //
        // find coordinate extents of map, at a rounded zoom level.
        //
        var round_coord = this.roundCoord(),
            tl = this.pointCoordinate(new Core.Point(0, 0)),
            br = this.pointCoordinate(new Core.Point(this.center.x*2, this.center.y*2));
        
        // convert to zoom level we'll use for tiles.
        tl = tl.zoomTo(round_coord.zoom).container();
        br = br.zoomTo(round_coord.zoom).container();
        
        //
        // generate visible tile coords.
        //
        var tiles = [];
        
        for(var i = tl.row; i <= br.row; i++) {
            for(var j = tl.column; j <= br.column; j++) {
                var coord = new Core.Coordinate(i, j, round_coord.zoom);
                tiles.push(new Tile.Tile(coord, this));
            }
        }
        
        return tiles;
    }
}