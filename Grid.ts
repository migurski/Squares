///<reference path="d3types.ts" />
import Coordinate = module('Coordinate');
import Tile = module('Tile');
import Map = module('Map');

var c = new Coordinate.Coordinate(0, 0, 0);

console.log(c.toString(), c.toKey(), c.zoomBy(2).toString(), c.zoomBy(2).right().toString());

var t = new Tile.Tile(c);
var m = new Map.Map();