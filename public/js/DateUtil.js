"use strict";

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

Date.prototype.addDays = function (days)
{
    var d = new Date();
    d.setTime(this.getTime() + 1000 * 60 * 60 * 24 * days);
    return d;
};

Date.prototype.nextDay = function ()
{
    var d = new Date();
    d.setTime(this.getTime() + 1000 * 60 * 60 * 24 * 1);
    return d;
};

Date.prototype.nextWeek = function ()
{
    var d = new Date();
    d.setTime(this.getTime() + 1000 * 60 * 60 * 24 * 7);
    return d;
};

Date.prototype.prevWeek = function ()
{
    var d = new Date();
    d.setTime( this.getTime() + 1000 * 60 * 60 * 24 * 7);
    return d;
};



Date.prototype.toShortDate = function ()
{
    var month = '' + (this.getMonth() + 1),
        day = '' + this.getDate(),
        year = this.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [month, day].join('/');

};

Date.prototype.toDBDate = function () {

    var month = '' + (this.getMonth() + 1),
        day = '' + this.getDate(),
        year = this.getFullYear();

    return [year, month, day].join('-');
};

Date.prototype.getWeekNumber = function () {
    var d = new Date(+this);
    d.setHours(0,0,0);
    d.setDate(d.getDate()+4-(d.getDay()||7));
    return Math.ceil((((d-new Date(d.getFullYear(),0,1))/8.64e7)+1)/7);
};

Date.prototype.getRangeWeek = function()
{
    var year = this.getFullYear();
    var firstDay = new Date(year, 0, 1).getDay();
    var week = this.getWeekNumber();

    var d = new Date("Jan 01, " + year + " 01:00:00");

    //var d = new Date(year, 0, 0);
    var w = d.getTime() -(3600000*24*(firstDay-1))+ 604800000 * (week-1);
    var n1 = new Date(w);
    var n2 = new Date(w + 518400000);

    return {
        start : n1,
        end:    n2
    }
};

Date.prototype.toShortWeek = function () {
    return this.getRangeWeek().end.toShortDate();
};

Date.prototype.getMonthString = function () {
    var monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return monthNames[this.getMonth()];
};

Date.prototype.nextMonth = function () {
    if( this.getMonth() == 11 )
        return new Date(this.getFullYear() + 1, 0, this.getDate());
    else
        return new Date(this.getFullYear(), this.getMonth() + 1, this.getDate());
};

//TODO completare con xdate
Date.prototype.getDateOfWeek = function()
{
    var d = (1 + (w - 1) * 7); // 1st of January + 7 days for each week
    return new Date(y, 0, d);
};



