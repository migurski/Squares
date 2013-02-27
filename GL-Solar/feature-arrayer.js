// 
// features_list() is used via a Web Worker, called from Map class in map.js.
// 

self.addEventListener('message', onmessage);

var pi = Math.PI;

function onmessage(e)
{
    var start = (new Date()).getTime();
    
    var node_id = e.data.node_id,
        features = e.data.features,
        zoom = e.data.zoom,
        list = features_list(features, zoom);

    var end = (new Date()).getTime();
    
    self.postMessage({node_id: node_id, list: list, elapsed: end - start});
}

function features_list(features, zoom)
{
    var reds = {motorway: 1, motorway_link: 1, trunk: 1, trunk_link: 1, primary: 1};
    
    var pixel = 2 * pi / (1 << (zoom + 8)),
        floats = [];
    
    for(var i in features)
    {
        var props = features[i]['properties'],
            geometry = features[i]['geometry'],
            parts = (geometry['type'] == 'LineString') ? [geometry['coordinates']] : geometry['coordinates'];
        
        if(zoom < 14 && props['kind'] != 'major_road' && props['kind'] != 'highway')
        {
            continue;
        }
        
        var widths = highway_widths(props['highway'], props['kind'], zoom),
            inner = widths[0],
            outer = widths[1],
            incap = inner/7,
            outcap = inner/20;
        
        var layer = highway_layer(props['highway'], props['explicit_layer'], props['is_bridge'], props['is_tunnel']);
        
        for(var j in parts)
        {
            for(var k = 0; k < parts[j].length - 1; k++)
            {
                // Positions of line segment start and end in mercator
                var loc1 = {lon: parts[j][k][0], lat: parts[j][k][1]},
                    loc2 = {lon: parts[j][k+1][0], lat: parts[j][k+1][1]},
                    p1 = project(loc1),
                    p2 = project(loc2);
                    
                // Offsets to the front, back and sides of line segment in mercator
                var θ = Math.atan2(p2.y - p1.y, p2.x - p1.x),
                    ux = Math.cos(θ),
                    uy = Math.sin(θ),
                    vx = Math.cos(θ + pi/2),
                    vy = Math.sin(θ + pi/2);
                    
                // Positions of outer corners of line segment capped line in mercator
                var pa = {x: p1.x - vx*inner - ux*incap, y: p1.y - vy*inner - uy*incap},
                    pb = {x: p2.x - vx*inner + ux*incap, y: p2.y - vy*inner + uy*incap},
                    pc = {x: p2.x + vx*inner + ux*incap, y: p2.y + vy*inner + uy*incap},
                    pd = {x: p1.x + vx*inner - ux*incap, y: p1.y + vy*inner - uy*incap},
                    z = layer;
                    
                // Render colors, including alpha value based on is_tunnel
                var r = (props['highway'] in reds) ? 211/255 : 147/255,
                    g = (props['highway'] in reds) ?  54/255 : 161/255,
                    b = (props['highway'] in reds) ? 130/255 : 161/255,
                    a = (props['is_tunnel'] == 'yes') ? .4 : 1;
                
                // Two triangles covering this line segment, with (x, y, z, r, g, b, a) values.
                floats = floats.concat([pa.x, pa.y, z, r, g, b, a,   pb.x, pb.y, z, r, g, b, a,   pc.x, pc.y, z, r, g, b, a]);
                floats = floats.concat([pa.x, pa.y, z, r, g, b, a,   pc.x, pc.y, z, r, g, b, a,   pd.x, pd.y, z, r, g, b, a]);
                
                // Two additional triangles for bridge casings.
                if(zoom >= 15 && props['is_bridge'] == 'yes')
                {
                    // Positions of outer corners of line segment capped line in mercator
                    var pa = {x: p1.x - vx*outer - ux*outcap, y: p1.y - vy*outer - uy*outcap},
                        pb = {x: p2.x - vx*outer + ux*outcap, y: p2.y - vy*outer + uy*outcap},
                        pc = {x: p2.x + vx*outer + ux*outcap, y: p2.y + vy*outer + uy*outcap},
                        pd = {x: p1.x + vx*outer - ux*outcap, y: p1.y + vy*outer - uy*outcap},
                        z = layer - 10;

                    // Render colors for map background and adjusted z-index.
                    var r = 253/255,
                        g = 246/255,
                        b = 227/255;
                    
                    floats = floats.concat([pa.x, pa.y, z, r, g, b, a,   pb.x, pb.y, z, r, g, b, a,   pc.x, pc.y, z, r, g, b, a]);
                    floats = floats.concat([pa.x, pa.y, z, r, g, b, a,   pc.x, pc.y, z, r, g, b, a,   pd.x, pd.y, z, r, g, b, a]);
                }
            }
        }
    }
    
    return floats;
}

function project(loc)
{
    var λ = pi * loc.lon / 180,
        φ = pi * loc.lat / 180;
    
    var x = λ,
        y = Math.log(Math.tan(pi/4 + φ/2));
    
    return {x: x, y: y};
}

//
// Larger numbers cause roads to shrink faster on zoom out.
//
var highway_coefficients = {
    motorway: .6, trunk: .6, primary: .6, secondary: .6, tertiary: .6,
    motorway_link: .7, trunk_link: .7, primary_link: .7, secondary_link: .7, tertiary_link: .7
    };

//
// Get highway width in mercator radians.
//
function highway_widths(highway, kind, zoom)
{
    var pixel = 2 * pi / (1 << (zoom + 8)),
        coeff = (highway in highway_coefficients) ? highway_coefficients[highway] : .8,
        coeff = (kind == 'path' ? .9 : coeff),
        scale = Math.pow(2, coeff * (zoom - 18));
    
    if(highway == 'motorway') {
        var inner = 14;

    } else if(kind == 'path' || kind == 'rail' || highway == 'service') {
        var inner = 3;

    } else {
        var inner = 6.5;
    }

    return [inner * pixel * scale, (inner + 4) * pixel * scale];
}

//
// Smaller numbers prioritize roads in front of other roads.
//
var highway_priorities = {
    motorway: 0, trunk: 1, primary: 2, secondary: 3, tertiary: 4,
    motorway_link: 5, trunk_link: 5, primary_link: 5, secondary_link: 5, tertiary_link: 5,
    residential: 6, unclassified: 6, road: 6,
    unclassified: 7, service: 7, minor: 7
    };

//
// Get highway layer (z-index) as an integer.
//
function highway_layer(highway, explicit_layer, is_bridge, is_tunnel)
{
    // explicit layering mostly wins
    var layer = (explicit_layer == undefined) ? 0 : explicit_layer * 1000;
    
    // implicit layering less important.
    if(is_bridge == 'yes')
    {
        layer += 100;
    }
    
    if(is_tunnel == 'yes')
    {
        layer -= 100;
    }
    
    // leave the +/-10 order of magnitude open for bridge casings.
    
    // adjust slightly based on priority derived from highway type
    layer -= (highway in highway_priorities) ? highway_priorities[highway] : 9;
    
    return layer;
}
