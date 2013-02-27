function linkProgram(gl, vsource, fsource)
{
    if(gl == undefined)
    {
        alert("Your browser does not support WebGL, try Google Chrome? Sorry.");
        throw "Your browser does not support WebGL, try Google Chrome? Sorry.";
    }

    var program = gl.createProgram(),
        vshader = createShader(gl, vsource, gl.VERTEX_SHADER),
        fshader = createShader(gl, fsource, gl.FRAGMENT_SHADER);

    gl.attachShader(program, vshader);
    gl.attachShader(program, fshader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS))
    {
        throw gl.getProgramInfoLog(program);
    }
    
    return program;
}

function createShader(gl, source, type)
{
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    {
        throw gl.getShaderInfoLog(shader);
    }

    return shader;
}

// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
// http://my.opera.com/emoller/blog/2011/12/20/requestanimationframe-for-smart-er-animating

// requestAnimationFrame polyfill by Erik Möller
// fixes from Paul Irish and Tino Zijdel

(function() {
    var lastTime = 0;
    var vendors = ['ms', 'moz', 'webkit', 'o'];
    for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
        window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
        window.cancelAnimationFrame = window[vendors[x]+'CancelAnimationFrame'] 
                                   || window[vendors[x]+'CancelRequestAnimationFrame'];
    }
 
    if (!window.requestAnimationFrame)
        window.requestAnimationFrame = function(callback, element) {
            var currTime = new Date().getTime();
            var timeToCall = Math.max(0, 16 - (currTime - lastTime));
            var id = window.setTimeout(function() { callback(currTime + timeToCall); }, 
              timeToCall);
            lastTime = currTime + timeToCall;
            return id;
        };
 
    if (!window.cancelAnimationFrame)
        window.cancelAnimationFrame = function(id) {
            clearTimeout(id);
        };
}());

function endianness()
{
    if(window.ArrayBuffer == undefined)
    {
        alert("Your browser does not support ArrayBuffer, try Google Chrome? Sorry.");
        throw "Your browser does not support ArrayBuffer, try Google Chrome? Sorry.";
    }

    var b = new ArrayBuffer(4),
        f = new Float32Array(b),
        u = new Uint32Array(b);

    f[0] = 1.0;
    
    if(u[0] == 32831) {
        return 'big';
    
    } else {
        return 'little';
    }
}
