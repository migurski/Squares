import Image = module('Image');

function makeMap(parent:HTMLElement, template:string, row:number, column:number, zoom:number):Image.Map
{
    return new Image.Map(parent, template, row, column, zoom);
}

window['makeMap'] = makeMap;
