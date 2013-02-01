export class Point
{
    public x:number;
    public y:number;
    
    constructor(x:number, y:number)
    {
        this.x = x;
        this.y = y;
    }
    
    public toString():string
    {
        return "(" + this.x.toFixed(3) + ", "
                   + this.y.toFixed(3) + ")";
    }
}

export class Coordinate
{
    public row:number;
    public column:number;
    public zoom:number;
    
    constructor(row:number, column:number, zoom:number)
    {
        this.row = row;
        this.column = column;
        this.zoom = zoom;
    }
    
    public toString():string
    {
        return "(" + this.row.toFixed(3) + ", "
                   + this.column.toFixed(3) + " @"
                   + this.zoom.toFixed(3) + ")";
    }
    
    public toKey():string
    {
        return [Math.floor(this.zoom), Math.floor(this.column), Math.floor(this.row)].join('/');
    }
    
    public copy():Coordinate
    {
        return new Coordinate(this.row, this.column, this.zoom);
    }
    
    public container():Coordinate
    {
        // using floor here (not parseInt, ~~) because we want -0.56 --> -1
        var coord:Coordinate = this.zoomTo(Math.floor(this.zoom));
        
        return new Coordinate(Math.floor(coord.row), 
                              Math.floor(coord.column), 
                              coord.zoom);
    }
    
    public zoomTo(destination:number):Coordinate
    {
        var power = Math.pow(2, destination - this.zoom);
        return new Coordinate(this.row * power,
                              this.column * power,
                              destination);
    }
    
    public zoomBy(distance:number):Coordinate
    {
        var power = Math.pow(2, distance);
        return new Coordinate(this.row * power,
                              this.column * power,
                              this.zoom + distance);
    }
    
    public up(distance=1):Coordinate
    {
        return new Coordinate(this.row - distance, this.column, this.zoom);
    }
    
    public right(distance=1):Coordinate
    {
        return new Coordinate(this.row, this.column + distance, this.zoom);
    }
    
    public down(distance=1):Coordinate
    {
        return new Coordinate(this.row + distance, this.column, this.zoom);
    }
    
    public left(distance=1):Coordinate
    {
        return new Coordinate(this.row, this.column - distance, this.zoom);
    }
}
