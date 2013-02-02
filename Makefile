Grid.min.js: d3types.ts \
	         Base.ts Core.ts Grid.ts Mouse.ts Map.ts Tile.ts Image.ts Div.ts
	tsc --out . Base.ts Core.ts Grid.ts Mouse.ts Map.ts Tile.ts Image.ts Div.ts
	browserify -o Grid.bro.js --exports require Map.js
	cat Grid.bro.js | jsmin >$@

clean:
	rm -f Base.js Core.js Grid.js Mouse.js Map.js Tile.js Image.js Div.js
	rm -f Grid.min.js