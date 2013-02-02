import Tile = module('Tile');

class Request
{
    public id:string;
    private image:HTMLImageElement;
    private src:string;

    constructor(image:HTMLImageElement, src:string)
    {
        this.id = image.id;
        this.image = image;
        this.src = src;
    }
    
   /*
    * Prevent future loads from actually happening.
    */
    public deny():void
    {
        this.image = null;
    }
    
   /*
    * Attempt to load the image.
    *
    * Return true if it's not been previously-denied.
    */
    public load():Boolean
    {
        if(this.image && this.image.parentNode)
        {
            this.image.src = this.src;
            return true;
        }
        
        return false;
    }
}

export class Queue
{
    private queue:any[] = [];
    private queue_by_id:Object = {};
    private open_request_count:number = 0;
    private requests_by_id:Object = {};
    
    // Dictionary of loaded tiles on loan from the Map object.
    private loaded_tiles:Object;
    
    constructor(loaded_tiles:Object)
    {
        this.loaded_tiles = loaded_tiles;
    }
    
   /**
    * Add an image and desired source URL to the queue.
    */
    public append(image:HTMLImageElement, src:string):void
    {
        if(src in this.loaded_tiles) {
            // if we've seen it this session the browser cache probably has it.
            image.src = src;
            
        } else {
            var request:Request = new Request(image, src);

            this.queue.push(request);
            this.queue_by_id[request.id] = request;
        }
    }
    
   /**
    * Cancel loading on an image whether it's been processed or not.
    */
    public cancel(image:HTMLImageElement):void
    {
        /*
        // attempt to cancel loading for incomplete tiles
        // and prevent very large/tiny tiles from being scaled
        // (remove these immediately so they don't slow down positioning)
        if (!this.complete || (coord.z - tile.z > 5) || (tile.z - coord.z > 2)) {
            this.src = null;
            d3.select(this).remove();
        }
        */

        this.close(image);
        
        var request:Request = this.queue_by_id[image.id];

        if(request)
        {
            request.deny();
            delete this.queue_by_id[image.id];
        }            
    }

   /**
    * Called when tiles are complete or from this.cancel().
    */
    public close(image:HTMLImageElement)
    {
        var request:Request = this.requests_by_id[image.id];

        if(request)
        {
            request.deny();
            delete this.requests_by_id[image.id];
            this.open_request_count--;
        }            
    }
    
   /**
    * Request up to 8 things from the queue, skipping blank items.
    */
    public process():void
    {
        while(this.open_request_count < 8 && this.queue.length > 0)
        {
            var request:Request = this.queue.shift(),
                loading:Boolean = request.load();

            if(loading)
            {
                this.requests_by_id[request.id] = request; 
                this.open_request_count++;
            }

            delete this.queue_by_id[request.id];                        
        }
    }
}
