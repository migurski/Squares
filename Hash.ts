/*
 * Support for location.hash values in the form "#12/37.8043/-122.2712".
 *
 * Implemented as a series of functions rather than a control class because
 * exactly one map can be controlled this way on a web page. First past the
 * post wins. Substantially borrowed from:
 *
 *   https://github.com/mlevans/leaflet-hash
 */
import Base = module('Base');
import Geo = module('Geo');

var has_hash_change:Boolean = ('onhashchange' in window) && (!('documentMode' in window) || window['documentMode'] > 7);
var hash_changed_by_me:Boolean = false;
var hash_change_timeout:number;
var hash_linked_map:Base.Map;

export function link_control(map:Base.Map):void
{
    // this only works the first time
    if(hash_linked_map)
    {
        return;
    }
    
    hash_linked_map = map;
    
    // when first linked, pick up anything in the current location.hash.
    on_hash_changed();

    window.addEventListener('hashchange', on_hash_changed);
    hash_linked_map.onMoved(on_mapmoved);
}

function on_mapmoved(map:Base.Map):void
{
    if(hash_change_timeout) {
        // already waiting.
        return;

    } else if(map != hash_linked_map) {
        // wrong map!
        return;
    }

    hash_change_timeout = window.setTimeout(update_hash, 50);
}

function update_hash():void
{
    clearTimeout(hash_change_timeout);
    hash_change_timeout = null;

    var zoom = hash_linked_map.grid.zoom(),
        round = (Math.round(zoom).toFixed(2) == zoom.toFixed(2)),
        precision = Math.round(Math.log(1 << zoom + 8) / Math.log(10)),
        digits = Math.max(0, precision - 2),
        loc = hash_linked_map.pointLocation(null),
        parts = [zoom.toFixed(round ? 0 : 2), loc.lat.toFixed(digits), loc.lon.toFixed(digits)];

    hash_changed_by_me = true;
    location.hash = '#' + parts.join('/');
}

function on_hash_changed():void
{
    if(hash_changed_by_me)
    {
        // prevent feedback loop
        hash_changed_by_me = false;
        return;
    }
    
    var match:string[] = location.hash.match(/^#(\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    
    if(match)
    {
        var zoom = parseFloat(match[1]),
            loc = new Geo.Location(parseFloat(match[2]), parseFloat(match[3]));
    
        hash_linked_map.setCenterZoom(loc, zoom);
    }
}
