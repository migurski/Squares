import Core = module('Core');
import Tile = module('Tile');

export var TileSize = 256;
export var TileExp = Math.log(TileSize) / Math.log(2);

var MinZoom = 0;
var MaxZoom = 18;

export class Grid
{
    public coord:Core.Coordinate;
    public center:Core.Point;
    
    // How many extra zoom levels to return from visible_tiles().
    private pyramid:number;
    
    constructor(w:number, h:number, pyramid:number)
    {
        this.resize(w, h);
        this.pyramid = pyramid;
    }
    
    public roundCoord():Core.Coordinate
    {
        return this.coord.zoomTo(Math.round(this.coord.zoom));
    }
    
   /**
    * Resize to a given width and height.
    */
    public resize(w:number, h:number):void
    {
        this.center = new Core.Point(w/2, h/2);
    }
    
   /**
    * Pan by a given x and y distance.
    */
    public panBy(x:number, y:number):void
    {
        var new_center = new Core.Point(this.center.x - x, this.center.y - y);
        this.coord = this.pointCoordinate(new_center);
    }
    
   /**
    * Zoom around a given anchor point by a specified amount.
    */
    public zoomByAbout(delta:number, anchor:Core.Point):void
    {
        var offset = new Core.Point(this.center.x*2 - anchor.x, this.center.y*2 - anchor.y),
            coord = this.pointCoordinate(new Core.Point(anchor.x, anchor.y));
        
        // center the grid on the wheeled-over coordinate
        this.coord = coord;
        
        // zoom the center coordinate
        this.coord = this.coord.zoomBy(delta);
        
        if(this.coord.zoom > MaxZoom) {
            this.coord = this.coord.zoomTo(MaxZoom);
        
        } else if(this.coord.zoom < MinZoom) {
            this.coord = this.coord.zoomTo(MinZoom);
        }
        
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
    public visibleTiles():Tile.Tile[]
    {
        //
        // find coordinate extents of grid, at a rounded zoom level.
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
        var tiles = [],
            parents = {};
        
        for(var i = tl.row; i <= br.row; i++)
        {
            for(var j = tl.column; j <= br.column; j++)
            {
                // add the coordinate to the list of visible tiles
                var coord = new Core.Coordinate(i, j, round_coord.zoom);
                tiles.push(new Tile.Tile(coord, this));
                
                //
                // check parent tiles against pyramid level; maybe they should come too?
                //
                for(var k = coord.zoom - 1; k >= coord.zoom - this.pyramid && k >= 0; k--)
                {
                    var parent = coord.zoomTo(k).container();
                    
                    // stop me if you've heard this one...
                    if(parent.toString() in parents)
                    {
                        break;
                    }
                    
                    parents[parent.toString()] = true;
                    tiles.push(new Tile.Tile(parent, this));
                }
            }
        }
        
        return tiles;
    }
}