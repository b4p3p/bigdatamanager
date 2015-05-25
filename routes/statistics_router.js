var ConstantsRouter = require('./constants_router');
var StatisticsCtrl = require("../controller/statisticsCtrl");

var s = new StatisticsCtrl();

var argContentStatistics = function(datas){

    if (!datas) datas = {};

    return {
        datas: JSON.stringify(datas),
        test: "test"
    };
};

var statisticsError = function(status, message)
{
    if(!status) status = 1;
    if(!message) message = 'error';

    return{
        status: status,
        message: message
    }
};

module.exports = function (app) {

    app.get('/getdata', function (req, res)
    {
        StatisticsCtrl.GetMapData("oim", function(err, data)
        {
            //arg.content = argContentStatistics(data);
            //arg.prova = JSON.stringify(data);
            //res.render('../views/pages/index.ejs', arg );
            res.json(data);
        });
    })

    app.get('/showmap', function (req, res)
    {
        var arg = ConstantsRouter.argIndex(req, ConstantsRouter.PAGE.STAT_MAP);

        if ( req.session.projectName != null )
        {
            StatisticsCtrl.GetMapData(req.session.projectName, function(err, data)
            {
                arg.content = argContentStatistics(data);



                arg.prova = JSON.stringify(data);

                res.render('../views/pages/index.ejs', arg );
            });
        }
        else
        {
            console.error("PAGE: showmap: nessun progetto selezionato");

            arg.content =   argContentStatistics();
            arg.error =     statisticsError(1, "No project selected");

            res.render('../views/pages/index.ejs', arg );
        }
    });

    app.get('/showregionsbar', function (req, res)
    {
        var arg = ConstantsRouter.argIndex(req, PAGE.STAT_REGIONS_BAR);
        res.render('../views/pages/index.ejs', arg );
    });

    app.get('/showregionsradar', function (req, res)
    {
        var arg = ConstantsRouter.argIndex(req, PAGE.STAT_REGIONS_RADAR);
        res.render('../views/pages/index.ejs', arg );
    });

    app.get('/showtimeline', function (req, res)
    {
        var arg = ConstantsRouter.argIndex(req,PAGE.STAT_TIMELINE);
        res.render('../views/pages/index.ejs', arg );
    });

    app.get('/showtag', function (req, res)
    {
        var arg = ConstantsRouter.argIndex(req, PAGE.STAT_TAG);
        res.render('../views/pages/index.ejs', arg );
    });

};

