var Util = function () {};

Util.addWhereClause = function(exec, query)
{
    if(query == null) return exec;

    if(query.hasOwnProperty("terms"))
    {
        var terms = query.terms.split(',');
        var reg = new RegExp( terms.join("|"), "i");
        exec.where({text: reg})
    }
    if(query.hasOwnProperty("nations"))
        exec.where('nation').in( query.nations.split(",") );

    if(query.hasOwnProperty("regions"))
        exec.where('region').in( query.regions.split(","));

    if(query.hasOwnProperty("users"))
        exec.where('user').in(query.users.split(","));

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

module.exports = Util;
