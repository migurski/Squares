///<reference path="d3types.ts" />
import Core = module('Core');

export class Map
{
    public coord:Core.Coordinate;
    public center:Core.Point;
    public tilesize:Core.Point;
    
    constructor()
    {
    }
    
    public roundCoord():Core.Coordinate
    {
        return this.coord.zoomBy(Math.round(this.coord.zoom) - this.coord.zoom);
    }
    
    public resize(size:Core.Point):void
    {
        this.center = new Core.Point(size.x/2, size.y/2);
    }
}