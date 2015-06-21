/**
 * Created by annarita on 21/06/15.
 */

Date.prototype.yyyymmdd = function() {
    var yyyy = this.getFullYear().toString();
    var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
    var dd  = this.getDate().toString();
    return yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0]); // padding
};

Number.prototype.padLeft = function(base,chr){
    var  len = (String(base || 10).length - String(this).length)+1;
    return len > 0? new Array(len).join(chr || '0')+this : this;
};

Date.prototype.toStringDate = function()
{
    return [
            (this.getMonth() + 1).padLeft(),
            this.getDate().padLeft(),
            this.getFullYear()
        ].join('/') + ' ' +
        [
            this.getHours().padLeft(),
            this.getMinutes().padLeft(),
            this.getSeconds().padLeft()
        ].join(':');
};