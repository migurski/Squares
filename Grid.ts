///<reference path="d3types.ts" />
import Core = module('Core');
import Tile = module('Tile');
import Map = module('Map');

var c = new Core.Coordinate(0, 0, 0);

console.log(c.toString(), c.toKey(), c.zoomBy(2).toString(), c.zoomBy(2).right().toString());

var t = new Tile.Tile(c);
var m = new Map.Map();

class Grid
{
    private selection:ID3Selection;
    private parent:Element;
    private map:Map.Map;
    
    constructor(id:string)
    {
        this.selection = d3.select('#'+id);
        this.parent = document.getElementById(id);
        this.map = new Map.Map();
    }
}

function makeMap(id:string):Grid
{
    return new Grid(id);
}

window['makeMap'] = makeMap;
