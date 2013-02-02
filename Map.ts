import Image = module('Image');
import Div = module('Div');

var sorry_docbody_safari5:string = 'Sorry, for the moment I can’t figure out how to make the mousewheel work in Safari 5.0 when the parent element is the document body. Try making your parent element a DIV?';

function makeImgMap(parent:HTMLElement, template:string, row:number, column:number, zoom:number):Image.Map
{
    if(parent == document.body)
    {
        throw Error(sorry_docbody_safari5);
    }

    return new Image.Map(parent, template, row, column, zoom);
}

function makeDivMap(parent:HTMLElement, row:number, column:number, zoom:number):Div.Map
{
    if(parent == document.body)
    {
        throw Error(sorry_docbody_safari5);
    }

    return new Div.Map(parent, row, column, zoom);
}

window['makeImgMap'] = makeImgMap;
window['makeDivMap'] = makeDivMap;
