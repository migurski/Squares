Grid.min.js: d3types.ts \
	         Base.ts Core.ts Grid.ts Map.ts Tile.ts Image.ts Mouse.ts
	tsc --out . Base.ts Core.ts Grid.ts Map.ts Tile.ts Image.ts Mouse.ts
	browserify -o Grid.bro.js --exports require Map.js
	cat Grid.bro.js | jsmin >$@

clean:
	rm -f Base.js Core.js Grid.js Map.js Tile.js Image.js Mouse.js
	rm -f Grid.min.js