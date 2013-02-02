Grid.min.js: d3types.ts \
	         Map.ts Core.ts Tile.ts Grid.ts Queue.ts
	tsc --out . Map.ts Core.ts Tile.ts Grid.ts Queue.ts
	browserify -o Grid.bro.js --exports require Map.js
	cat Grid.bro.js | jsmin >$@
