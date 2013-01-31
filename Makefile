Grid.min.js: Grid.ts Coordinate.ts Tile.ts Map.ts
	tsc --out . $^
	browserify -o Grid.bro.js --exports require Grid.js
	jsmin <Grid.bro.js >$@
