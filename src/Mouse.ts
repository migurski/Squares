///<reference path="d3types.ts" />
import Base = module('Base');
import Core = module('Core');
import Grid = module('Grid');

//
// Browser-specific mousewheel handling, borrowed from
// https://github.com/mbostock/d3/pull/1050/files
//
if('onwheel' in document) {
    var d3_behavior_zoom_wheel = 'wheel';
    var d3_behavior_zoom_delta = function():number { return -d3.event.deltaY * (d3.event.deltaMode ? 40 : 1); };

} else if('onmousewheel' in document) {
    var d3_behavior_zoom_wheel = 'mousewheel';
    var d3_behavior_zoom_delta = function():number { return d3.event.wheelDelta; };

} else {
    var d3_behavior_zoom_wheel = 'MozMousePixelScroll';
    var d3_behavior_zoom_delta = function():number { return -d3.event.detail; };
}

export function element_size(element:HTMLElement):Core.Point
{
    if(element == document.body)
    {
        return new Core.Point(window.innerWidth, window.innerHeight);
    }

    return new Core.Point(element.clientWidth, element.clientHeight);
}

export function link_control(selection:ID3Selection, control:Control):void
{
    //
    // Set up zoom in/out buttons that look like Leaflet's.
    //
    var zoombox = selection.append('div'),
        zoomout = add_button(zoombox),
        zoom_in = add_button(zoombox);
    
    zoomout.style('margin-right', '5px');
        
    zoombox
        .style('z-index', 99)
        .style('position', 'absolute')
        .style('padding', '5px')
        .style('margin', '5px')
        .style('background-color', 'rgba(0, 0, 0, .2)')
        .style('border-radius', '6px');
    
    //
    // Use base64-encoded data URI for +/- button images.
    //
    var png_prefix = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAJAQMAAADaX5RTAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAAZQTFRFAAAA////pdmf3QAAAAJ0Uk5T/wDltzBKAAAAEUlEQVQI12',
        png_suffix = 'AAAAASUVORK5CYII=';
    
    zoom_in.append('img')
          .style('display', 'block')
          .style('pointer-events', 'none')
          .attr('src', png_prefix+'N43MAAQXAAEwEAcZcIUxqnpLs'+png_suffix);
        
    zoomout.append('img')
          .style('display', 'block')
          .style('pointer-events', 'none')
          .attr('src', png_prefix+'P438AAQXAAEwEAescI+0eupfw'+png_suffix);
    
    //
    // Set up mouse event handlers
    //
    selection.on('dblclick.map', function() { control.onDoubleclick() });
    selection.on('mousedown.map', function() { control.onMousedown() });
    selection.on(d3_behavior_zoom_wheel+'.map', function() { control.onMousewheel() });
    selection.on('DOMMouseScroll.map', function() { control.onMousewheel() });
    
    zoom_in
        .on('click.in', function() { control.onZoomin() })
        .on('dblclick.in', smother_event);
        
    zoomout
        .on('click.out', function() { control.onZoomout() })
        .on('dblclick.out', smother_event);
}

function add_button(parent:ID3Selection):ID3Selection
{
    var button = parent.append('a');
    
    button
        .style('display', 'block')
        .style('float', 'left')
        .style('cursor', 'pointer')
        .style('padding', '7px')
        .style('border-radius', '3px')
        .style('background-color', 'white')
        .style('opacity', .8)
        .on('mouseover.button', function() { button.style('opacity', 1) })
        .on('mouseout.button', function() { button.style('opacity', .8) });
    
    return button;
}

function smother_event():void
{
    d3.event.preventDefault();
    d3.event.stopPropagation();                        
}

export class Control
{
    private map:Base.Map;
    private whole_zooms:Boolean;
    
    constructor(map:Base.Map, whole_zooms:Boolean)
    {
        this.map = map;
        this.whole_zooms = whole_zooms;
    }
    
    private nextZoomIn():number
    {
        var zoom = this.map.grid.zoom() + 1;
        return this.whole_zooms ? Math.round(zoom) : zoom;
    }
    
    private nextZoomOut():number
    {
        var zoom = this.map.grid.zoom() - 1;
        return this.whole_zooms ? Math.round(zoom) : zoom;
    }
    
    public onZoomin():void
    {
        this.map.grid.zoomToAbout(this.nextZoomIn(), this.map.grid.center);
        this.map.redraw(true);

        smother_event();
    }
    
    public onZoomout():void
    {
        this.map.grid.zoomToAbout(this.nextZoomOut(), this.map.grid.center);
        this.map.redraw(true);

        smother_event();
    }
    
    public onDoubleclick():void
    {
        var mouse = d3.mouse(this.map.parent),
            anchor = new Core.Point(mouse[0], mouse[1]),
            target = d3.event.shiftKey ? this.nextZoomOut() : this.nextZoomIn();
        
        this.map.grid.zoomToAbout(target, anchor);
        this.map.redraw(true);
    }

    public onMousedown():void
    {
        var control = this,
            start_mouse = new Core.Point(d3.event.pageX, d3.event.pageY);

        d3.select(window)
            .on('mousemove.map', this.getOnMousemove(start_mouse))
            .on('mouseup.map', function() { control.onMouseup() })

        smother_event();
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
            map.redraw(true);
            
            prev = curr;
        }
    }
    
    public onMousewheel():void
    {
        var mouse = d3.mouse(this.map.parent),
            anchor = new Core.Point(mouse[0], mouse[1]),
            target = this.map.grid.zoom() + 0.001 * d3_behavior_zoom_delta();
        
        this.map.grid.zoomToAbout(target, anchor);
        this.map.redraw(true);

        smother_event();
    }
}