Grid.min.js: Grid.bro.js
	curl --data-urlencode "js_code@Grid.bro.js" \
	     -d compilation_level=SIMPLE_OPTIMIZATIONS \
	     -d output_info=compiled_code \
	     -d output_format=text \
	     -so Grid.min.js \
	     http://closure-compiler.appspot.com/compile

Grid.bro.js: d3types.ts \
	         Base.ts Core.ts Geo.ts Grid.ts Mouse.ts Hash.ts Map.ts Tile.ts Image.ts Div.ts

	tsc --out . Base.ts Core.ts Geo.ts Grid.ts Mouse.ts Hash.ts Map.ts Tile.ts Image.ts Div.ts
	browserify -o Grid.bro.js --exports require Map.js
	if [ `which dos2unix` ]; then dos2unix -q Grid.bro.js; fi

clean:
	rm -f Base.js Core.js Geo.js Grid.js Mouse.js Hash.js Map.js Tile.js Image.js Div.js
	rm -f Grid.min.js