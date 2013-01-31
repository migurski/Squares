import Coordinate = module('Coordinate');

export class Map
{
    public coordinate:Coordinate.Coordinate;
    public center:Coordinate.Point;
    public tilesize:Coordinate.Point;
    
    constructor()
    {
    }
    
    public roundCoord():Coordinate.Coordinate
    {
        return this.coordinate.zoomBy(Math.round(this.coordinate.zoom)-this.coordinate.zoom);
    }
}