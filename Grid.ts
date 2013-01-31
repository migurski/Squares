import thing = module('Coordinate');

var c = new thing.Coordinate(0, 0, 0);

console.log(c.toString(), c.toKey(), c.zoomBy(2).toString(), c.zoomBy(2).right().toString());