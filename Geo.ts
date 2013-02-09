import Core = module('Core');

/**
 * Location class stores latitude and longitude in degrees.
 */
export class Location
{
    public lat:number;
    public lon:number;
    
    constructor(lat:number, lon:number)
    {
        this.lat = lat;
        this.lon = lon;
    }
    
    public toString():string
    {
        return "(" + this.lat.toFixed(6) + ", "
                   + this.lon.toFixed(6) + ")";
    }
}

var π = Math.PI;

/**
 * Spherical mercator implementation for tiles.
 *
 * See also http://mathworld.wolfram.com/MercatorProjection.html
 */
export class Mercator
{
    constructor()
    {
        
    }
    
   /**
    * Raw projection method returns points in radians.
    */
    public project(loc:Location):Core.Point
    {
        var λ = π * loc.lon / 180,
            φ = π * loc.lat / 180;
        
        var x = λ,
            y = Math.log(Math.tan(π/4 + φ/2));
        
        return new Core.Point(x, y);
    }
    
   /**
    * Raw inverse projection method takes points in radians.
    */
    public inverse(point:Core.Point):Location
    {
        var λ = point.x,
            φ = 2 * Math.atan(Math.exp(point.y)) - π/2;
        
        var lat = 180 * φ / π,
            lon = 180 * λ / π;
        
        return new Location(lat, lon);
    }
    
   /**
    * Return a tile coordinate for a location.
    *
    * See also http://wiki.openstreetmap.org/wiki/QuadTiles
    */
    public locationCoordinate(loc:Location, zoom:number=0):Core.Coordinate
    {
        var p = this.project(loc),
            col = (p.x + π) / (2 * π),
            row = (π - p.y) / (2 * π);
        
        return new Core.Coordinate(row, col, 0).zoomTo(zoom);
    }
    
   /**
    * Return a location for a tile coordinate.
    *
    * See also http://wiki.openstreetmap.org/wiki/QuadTiles
    */
    public coordinateLocation(coord:Core.Coordinate):Location
    {
        var coord = coord.zoomTo(0),
            x = (coord.column * 2 * π) - π,
            y = π - (coord.row * 2 * π);
        
        return this.inverse(new Core.Point(x, y));
    }
}
