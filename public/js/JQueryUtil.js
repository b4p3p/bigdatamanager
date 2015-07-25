jQuery.fn.outerHTML = function() {
    return jQuery('<div />').append(this.eq(0).clone()).html();
};

Array.prototype.indexOfObject = function(key, value)
{
    if(this.length == 0 ) return -1;

    for( var i = 0; i < this.length; i++)
        if(this[i][key] == value)
            return i;

    return -1;
};
