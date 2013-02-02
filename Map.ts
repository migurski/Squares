import Image = module('Image');
import Div = module('Div');

function makeImgMap(parent:HTMLElement, template:string, row:number, column:number, zoom:number):Image.Map
{
    return new Image.Map(parent, template, row, column, zoom);
}

function makeDivMap(parent:HTMLElement, row:number, column:number, zoom:number):Div.Map
{
    return new Div.Map(parent, row, column, zoom);
}

window['makeImgMap'] = makeImgMap;
window['makeDivMap'] = makeDivMap;
