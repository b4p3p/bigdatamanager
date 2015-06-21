/**
 * Created by b4p3p on 25/05/15.
 */

var ConstantsRouter = {};


/**
 *
 * @param   req - request
 * @param   page - PAGE
 * @param   error - { status:{Number}, message: {String} }
 * @returns arg
 */
ConstantsRouter.argIndex = function(req, page, error)
{
    //TODO DEBUG
    if ( req && req.session )
    {
        req.session.projectName = req.session.projectName ? req.session.projectName : "oim";
        req.session.userProject = req.session.userProject ? req.session.userProject : "oim";
    }

    var ris = {};

    if (req && req.session.arg)  // uso  i paramenti presenti nella variabile di sessione
    {
        ris = req.session.arg;
        req.session.arg = null;
    }

    ris.userProject = (req) ? req.session.userProject : "oim";
    ris.projectName = (req) ? req.session.projectName : "oim";
    ris.page = page || '';
    ris.error = { };

    return ris;

    //return {
    //    userProject: userProject ,
    //    projectName: projectName,
    //    page: page,
    //    tab: '',
    //    error: {},
    //    content: {}
    //}
};

/**
 *  Constanti delle pagine
 */
ConstantsRouter.PAGE = {

    HOME: "home",

    //PROJECT
    NEW_PROJECT: "new-project",
    OPEN_PROJECT: "open-project",
    EDIT_PROJECT: "edit-project",

    //NATIONS
    DB_USERS: "db-users",
    DB_NATIONS: "db-nations",

    //STAT
    STAT_MAP: "stat-map",
    STAT_REGIONS_BAR: "stat-regions-bar",
    STAT_REGIONS_RADAR: "stat-regions-radar",
    STAT_TIMELINE: "stat-timeline",
    STAT_TAG: "stat-tag"
};

/**
 *  Tab delle pagine
 */
ConstantsRouter.TAB = {
    NEWPROJECT: "newproject",
    OPENPROJECT: "openproject"
};

module.exports = ConstantsRouter;
