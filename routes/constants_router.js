/**
 * Created by b4p3p on 25/05/15.
 */

var ConstantsRouter = {};

/**
 * Parametro da passare al  modulo di render di ejs
 * @param   req - request
 * @param   page - PAGE
 * @param   error - { status:{Number}, message: {String} }
 * @returns arg
 */
ConstantsRouter.argIndex = function(req, page)
{
    //TODO DEBUG
    if ( req && req.session )
    {
        req.session.project = req.session.project ? req.session.project : "crowdpulse";
        req.session.user = req.session.user ? req.session.user : "oim";
    }

    var ris = {};

    if (req && req.session.arg)  // uso  i paramenti presenti nella variabile di sessione
    {
        ris = req.session.arg;
        req.session.arg = null;
    }

    ris.isGuest     = req.session.isGuest;
    ris.page        = page || '';
    ris.status      = { status:0, message: '' };
    ris.user        = (req) ? req.session.user    : "";
    ris.project     = (req) ? req.session.project : "";

    return ris;

};

ConstantsRouter.argError = function(status, message)
{
    var arg = ConstantsRouter.argIndex();
    arg.status = ConstantsRouter.status(status, message);
    return arg;
};

ConstantsRouter.status = function(status, message )
{
    return {
        status: status,
        message: message
    }
};

/**
 *  Constanti delle pagine
 */
ConstantsRouter.PAGE =
{

    HOME: "home",
    PROFILE: "profile",

    //PROJECT
    NEW_PROJECT: "new-project",
    OPEN_PROJECT: "open-project",
    EDIT_PROJECT: "edit-project",

    //NATIONS
    DB_USERS: "db-users",
    DB_NATIONS: "db-nations",

    //STAT
    STAT_MAP: "stat-map",
    STAT_COMPARE: "stat-compare",
    STAT_TIMELINE: "stat-timeline",
    STAT_TAG: "stat-tag"
};

/**
 *  Tab delle pagine
 */
ConstantsRouter.TAB =
{
    NEWPROJECT: "newproject",
    OPENPROJECT: "openproject"
};

module.exports = ConstantsRouter;
