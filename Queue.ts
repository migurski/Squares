///<reference path="d3types.ts" />
import Tile = module('Tile');

export class Queue
{
    private queue:Array;
    private queue_by_id:Object;
    private open_request_count:number = 0;
    private requests_by_id:Object;
    
    public append(image:any, src:string):void
    {
        d3.select(image).attr('src', src);
    }
    
    public remove(image:HTMLImageElement):void
    {
        // console.log('Gone', image['src']);
    }
}
