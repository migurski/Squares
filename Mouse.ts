///<reference path="d3types.ts" />
import Base = module('Base');
import Core = module('Core');
import Grid = module('Grid');

export function element_size(element:HTMLElement):Core.Point
{
    if(element == document.body)
    {
        return new Core.Point(window.innerWidth, window.innerHeight);
    }

    return new Core.Point(element.clientWidth, element.clientHeight);
}

export class Control
{
    private map:Base.Map;
    
    // secret div used in d3_behavior_zoom_delta to correct mouse wheel speed.
    private d3_behavior_zoom_div:Node;
    
    constructor(map:Base.Map)
    {
        this.map = map;
    }
    
    public onDoubleclick():void
    {
        var mouse = d3.mouse(this.map.parent),
            anchor = new Core.Point(mouse[0], mouse[1]),
            amount = d3.event.shiftKey ? -1 : 1;
        
        this.map.grid.zoomByAbout(amount, anchor);
        this.map.redraw();
        // d3.timer(redraw);
    }

    public onMousedown():void
    {
        var control = this,
            start_mouse = new Core.Point(d3.event.pageX, d3.event.pageY);

        d3.select(window)
            .on('mousemove.map', this.getOnMousemove(start_mouse))
            .on('mouseup.map', function() { control.onMouseup() })

        d3.event.preventDefault();
        d3.event.stopPropagation();                        
    }
    
    public onMouseup():void
    {
        d3.select(window)
            .on('mousemove.map', null)
            .on('mouseup.map', null)
    }
    
    private getOnMousemove(start:Core.Point):()=>void
    {
        var map = this.map,
            prev = start;
    
        return function()
        {
            var curr = new Core.Point(d3.event.pageX, d3.event.pageY),
                dx = curr.x - prev.x,
                dy = curr.y - prev.y;

            map.grid.panBy(dx, dy);
            map.redraw();
            // d3.timer(redraw);
            
            prev = curr;
        }
    }
    
    public onMousewheel():void
    {
        var mouse = d3.mouse(this.map.parent),
            anchor = new Core.Point(mouse[0], mouse[1]);
        
        this.map.grid.zoomByAbout(this.d3_behavior_zoom_delta(), anchor);
        this.map.redraw();
        // d3.timer(redraw);

        d3.event.preventDefault();
        d3.event.stopPropagation();                        
    }

    private d3_behavior_zoom_delta():number
    {
        //
        // mousewheel events are totally broken!
        // https://bugs.webkit.org/show_bug.cgi?id=40441
        // not only that, but Chrome and Safari differ in re. to acceleration!
        //
        if(!this.d3_behavior_zoom_div)
        {
            this.d3_behavior_zoom_div = d3
                .select("body")
                .append("div")
                  .style("visibility", "hidden")
                  .style("top", 0)
                  .style("height", 0)
                  .style("width", 0)
                  .style("overflow-y", "scroll")
                  .append("div")
                    .style("height", "2000px")
                    .node()
                    .parentNode;
        }
        
        try {
            this.d3_behavior_zoom_div['scrollTop'] = 250;
            this.d3_behavior_zoom_div.dispatchEvent(d3.event);
            var delta:number = 250 - this.d3_behavior_zoom_div['scrollTop'];

        } catch (error) {
            var delta:number = d3.event.wheelDelta || (-d3.event.detail * 5);
        }
        
        return delta * .005;
    }          
}