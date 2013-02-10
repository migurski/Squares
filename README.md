Squares
=======

Squares is a small, extensible, [free and open-source](LICENSE) library for
in-browser maps, written in [Typescript](http://www.typescriptlang.org/) and
using [D3 v2](http://d3js.org/) under the hood.

Squares is an adaptation of [Bloom Studio’s D3Map](https://github.com/bloomtime/d3map#readme),
written by Tom Carden and ported to Typescript by [Michal Migurski](http://mike.teczno.com).

Try
---

A simple [demo with get lat+lon functionality](http://teczno.com/squares/) shows
off Squares’s core features:

 - Seam-free panning and zooming of tiled maps/images
 - Use of CSS transforms where available
 - Smooth mouse-wheeling with D3's normalized mouse-wheel delta
 - Mercator projection support, basic understanding of geography
 - Built-in [URL hash](https://github.com/mlevans/leaflet-hash) for linking

Why
---

Although D3 includes [a plug-in tile implementation](https://github.com/d3/d3-plugins/tree/master/geo/tile),
I believe that a complete library should include a first class tile layer
and coordinate data model. I’m also interested in how the tile layer abstraction
can be adapted to non-image tiles, especially with new browser technologies
like WebGL. At Stamen, we experimented with an earlier version of this library
and interactions with WebGL in the [Burning Map project](http://maps.stamen.com/burningmap/#14/37.8089/-122.2642).
Squares is a more formal library built on this idea, and includes a traditional
image-based map as well as a `DIV`-only map demonstrating non-image uses.

Why Not
-------

If you’re interested in traditional image-tiled maps, an extensive plug-in
ecosystem and user community, complete documentation and a stable API, then
Squares is probably not for you. Consider [Modest Maps](http://modestmaps.com/)
or [Leaflet](http://leafletjs.com/) for your lightweight mapping needs.

About D3 and Typescript
-----------------------

D3.js is a JavaScript library for manipulating documents based on data. D3
helps you bring data to life using HTML, SVG and CSS. D3’s emphasis on web
standards gives you the full capabilities of modern browsers without tying
yourself to a proprietary framework, combining powerful visualization
components and a data-driven approach to DOM manipulation.

Learn more at [d3js.org](http://d3js.org).

TypeScript is a language for application-scale JavaScript development.
TypeScript is a typed superset of JavaScript that compiles to plain JavaScript.

Learn more at [typescriptlang.org](http://typescriptlang.org).
