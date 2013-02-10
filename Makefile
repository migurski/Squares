Squares.min.js: Squares.bro.js
	curl --data-urlencode "js_code@Squares.bro.js" \
	     -d compilation_level=SIMPLE_OPTIMIZATIONS \
	     -d output_info=compiled_code \
	     -d output_format=text \
	     -so Squares.min.js \
	     http://closure-compiler.appspot.com/compile

Squares.bro.js: src/d3types.ts \
	            src/Base.ts src/Core.ts src/Geo.ts src/Grid.ts src/Mouse.ts \
	            src/Hash.ts src/Main.ts src/Tile.ts src/Image.ts src/Div.ts

	tsc --out src src/Base.ts src/Core.ts src/Geo.ts src/Grid.ts src/Mouse.ts \
	              src/Hash.ts src/Main.ts src/Tile.ts src/Image.ts src/Div.ts

	browserify -o Squares.bro.js --exports require src/Main.js
	if which dos2unix; then dos2unix -q Squares.bro.js; fi

clean:
	rm -f src/Base.js src/Core.js src/Geo.js src/Grid.js src/Mouse.js
	rm -f src/Hash.js src/Main.js src/Tile.js src/Image.js src/Div.js
	rm -f Squares.min.js