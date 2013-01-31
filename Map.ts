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
}