function Queue()
{
    this.queue = [];
    this.queue_by_id = {};
    this.open_request_count = 0;
    this.requests_by_id = {};
}

Queue.prototype = {

    append: function(node, href)
    {
        var request = new Request(node, href);
        
        this.queue.push(request);
        this.queue_by_id[request.id] = request;
    },
    
    cancel: function(node)
    {
        this.close(node);
        
        var request = this.queue_by_id[node.id];
        
        if(request)
        {
            request.deny();
            delete this.queue_by_id[node.id];
        }
    },
    
    close: function(node)
    {
        var request = this.requests_by_id[node.id];
        
        if(request)
        {
            request.deny();
            delete this.requests_by_id[node.id];
            this.open_request_count--;
        }
    },
    
    process: function()
    {
        //this.queue.sort(Request.prototype.compare);
        
        //console.log('processing', this.open_request_count, 'open req count', this.queue.length, 'queue');
        
        while(this.open_request_count < 4 && this.queue.length > 0)
        {
            var request = this.queue.shift(),
                loading = request.load();
            
            if(loading)
            {
                this.requests_by_id[request.id] = request;
                this.open_request_count++;
            }
            
            delete this.queue_by_id[request.id];
        }
    }

};

function Request(node, href)
{
    this.id = node.id;
    this.sort = node.sort;
    this.node = node;
    this.href = href;
}

Request.prototype = {

    deny: function()
    {
        this.node = null;
    },
    
    load: function()
    {
        if(this.node && this.node.parentNode)
        {
            d3.json(this.href, this.node.onjson);
            return true;
        }
        
        return false;
    },
    
    compare: function(a, b)
    {
        return b.sort - a.sort;
    }

};
