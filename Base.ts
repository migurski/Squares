import Grid = module('Grid');
import Core = module('Core');
import Geo = module('Geo');

export interface Map
{
    grid:Grid.Grid;
    parent:HTMLElement;
    redraw():void;

    pointLocation(point:Core.Point):Geo.Location;
    locationPoint(loc:Geo.Location):Core.Point;
}
