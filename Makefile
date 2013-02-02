Grid.min.js: d3types.ts \
	         Map.ts Core.ts Tile.ts Grid.ts Queue.ts Mouse.ts
	tsc --out . Map.ts Core.ts Tile.ts Grid.ts Queue.ts Mouse.ts
	browserify -o Grid.bro.js --exports require Map.js
	cat Grid.bro.js | jsmin >$@

clean:
	rm -f Map.js Core.js Tile.js Grid.js Queue.js Mouse.js
	rm -f Grid.min.js