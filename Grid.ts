///<reference path="d3types.ts" />
import Core = module('Core');
import Tile = module('Tile');
import Map = module('Map');

class Grid
{
    private selection:ID3Selection;
    private parent:Element;
    private map:Map.Map;
    
    constructor(id:string)
    {
        this.selection = d3.select('#'+id);
        this.parent = document.getElementById(id);
        
        var center = new Core.Point(this.parent.clientWidth/2, this.parent.clientHeight/2);
        
        this.map = new Map.Map(center);
        this.map.coord = new Core.Coordinate(.5, .5, 0).zoomTo(2.4);
    }
}

function makeMap(id:string):Grid
{
    return new Grid(id);
}

window['makeMap'] = makeMap;
