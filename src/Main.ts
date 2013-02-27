import Image = module('Image');
import Mouse = module('Mouse');
import Core = module('Core');
import Grid = module('Grid');
import Hash = module('Hash');
import Div = module('Div');
import Geo = module('Geo');

var sorry_docbody_safari5:string = 'Sorry, for the moment I can’t figure out how to make the mousewheel work in Safari 5.0 when the parent element is the document body. Try making your parent element a DIV?';

function makeImgMap(parent:HTMLElement, template:string, lat:number, lon:number, zoom:number):Image.Map
{
    if(parent == document.body)
    {
        throw Error(sorry_docbody_safari5);
    }

    return new Image.Map(parent, template, new Geo.Mercator(), new Geo.Location(lat, lon), zoom);
}

function makeDivMap(parent:HTMLElement, lat:number, lon:number, zoom:number):Div.Map
{
    if(parent == document.body)
    {
        throw Error(sorry_docbody_safari5);
    }

    return new Div.Map(parent, new Geo.Mercator(), new Geo.Location(lat, lon), zoom);
}

window['squares'] = {
    makeImgMap: makeImgMap,
    makeDivMap: makeDivMap,
    Image: { Map: Image.Map },
    Div: { Map: Div.Map },
    Core: {
        Point: Core.Point,
        Coordinate: Core.Coordinate
        },
    Geo: { Mercator: Geo.Mercator },
    Grid: { Grid: Grid.Grid },
    Mouse: {
        Control: Mouse.Control,
        link_control: Mouse.link_control,
        element_size: Mouse.element_size
        },
    Hash: {
        link_control: Hash.link_control
        }
    };

if(window['sq'] == undefined)
{
    window['sq'] = window['squares'];
}
