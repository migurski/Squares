Grid.min.js: Grid.ts Coordinate.ts
	tsc --out . Grid.ts Coordinate.ts
	browserify -o Grid.bro.js --exports require Grid.js
	jsmin <Grid.bro.js >Grid.min.js
