var Util = function () {};
var _ = require('underscore');
/**
 * Funzione usata nelle find
 */
Util.addWhereClause = function(exec, query)
{
    if(query == null) return exec;

    if( query.hasOwnProperty("isGeo") )
    {
        exec.where({latitude: {$exists:true}});
    }

    if(query.hasOwnProperty("terms"))
    {
        var terms = query.terms.split(',');
        var reg = new RegExp( terms.join("|"), "i");
        exec.where({text: reg})
    }

    if(query.hasOwnProperty("nations"))
    {
        exec.where('nation').in( query.nations.split(",") );
    }

    if(query.hasOwnProperty("text"))
    {
        var reg = new RegExp( query.text, "i");
        exec.where( {text: reg } );
    }

    if(query.hasOwnProperty("regions"))
        exec.where('region').in( query.regions.split(","));

    if(query.hasOwnProperty("users"))
        exec.where( 'user').in(query.users.split(","));

    if(query.hasOwnProperty("tags"))
        exec.where('tag').in(query.tags.split(","));

    if(query.hasOwnProperty("tokens"))
        exec.where('tokens').in(query.tokens.split(","));

    if(query.hasOwnProperty("end"))
        exec.where('date').lte(new Date(query.end));

    if(query.hasOwnProperty("start"))
        exec.where('date').gte(new Date(query.start));

    if(query.hasOwnProperty("eq"))
        exec.where('date').eq(new Date(query.end));

    if(query.skip)  exec.skip(query.skip);

    if(query.limit)
        exec.limit(query.limit);
    else
        exec.limit(30000);      //resolve crash chrome

    return exec;
};

/**
 * Funzione usata nelle aggregate
 */
Util.addMatchClause = function(exec, query)
{
    if( !query ) return;

    if(query.projectName)
        exec.match({projectName: query.projectName });

    if(query.tags){
        var tags = query.tags.split(',');
        exec.match({tag: {$in:tags}});
    }

    if(query.users){
        var users = query.users.split(',');
        exec.match({user: {$in:users}});
    }
    if(query.hasOwnProperty("nations"))
        if(_.isArray(query.nations))
            exec.match({nation: {$in: query.nations}});
        else
            exec.match({nation: {$in: query.nations.split(",")}});

    if(query.hasOwnProperty("regions"))
        if(_.isArray(query.regions))
            exec.match({region: {$in: query.regions}});
        else
            exec.match({region: {$in: query.regions.split(",")} });

    if(query.hasOwnProperty("tags"))
        exec.match({tag: {$in: query.tags.split(",") } });

    if(query.interval)
    {
        if(query.interval.min)
            exec.match({date: {$gte: new Date(query.interval.min)}});

        if(query.interval.max)
            exec.match({date: {$lte: new Date(query.interval.max)}});

        if(query.interval.start)
            exec.match({date: {$gte: new Date(query.interval.start)}});

        if(query.interval.end)
            exec.match({date: {$lte: new Date(query.interval.end)}});
    }

    if( query.start )
        exec.match({date: {$gte: new Date(query.start)}});
    if( query.end )
        exec.match({date: {$lte: new Date(query.end)}});


};

Util.replaceDot = function(string){
    return string.replace(/\./g, '\uff0E');
};

module.exports = Util;
