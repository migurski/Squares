import Image = module('Image');

function makeMap(parent:HTMLElement):Image.Map
{
    return new Image.Map(parent);
}

window['makeMap'] = makeMap;
