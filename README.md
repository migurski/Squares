About the TypeScript Thing
--------------------------

This branch of D3 Map is an attempt to tie [D3](http://d3js.org) to
Microsoft’s [TypeScript](http://www.typescriptlang.org) to see if they can
play well together. I’ve only just learned half of this stuff earlier today,
but I’m really enjoying the contrast between the two environments.

`new.html` is the place to check the output, `Grid.bro.js` is the compiled
code run through [browserify](http://browserify.org).

Tom Carden’s Original Notes
---------------------------

An exercise in learning D3 for DOM manipulation and transitions. Still just an engine demo. Needs more features to be a full map library. Consider this my (@RandomEtc) hat in the ring for what comes after Modest Maps JS and Polymaps.

Features:

* seam-free panning and zooming of tiled maps/images
* use of CSS transforms where available
* smooth fading in/out when tiles are loaded/removed
* smooth mouse-wheeling with D3's normalized mouse-wheel delta
* wrap around panning horizontally
* doesn't load images above/below the mercator square limit
* uses browser cache rather than handling cache internally

TODO:

* geo projections
* zoom to lat/lon
* animation, momentum for scrolling
* mobile support
* non-full-screen map support
* support more than one map per page
* layers and overlays
* basic UI
* more mouse/touch handlers
* browser testing

There is no plan to implement these things in any specific order or on any particular schedule. Please only use this library if you are interested in hacking on it from the beginning. Other libraries are much more fully featured. See http://groups.google.com/group/d3-js/browse_thread/thread/e0243bb66a438be1 for further discussion.

Uses CSS (3D) transforms where available, falls back to normal CSS if not. Coordinate and tile positioning logic cribbed from Modest Maps. Most of the work is done by D3. Queueing img requests seems overkill but smooths things out a lot.

(C) 2011 Bloom Studio, Inc. 

Distributed under the same BSD license as D3 itself, see LICENSE.

Contributions welcome!

