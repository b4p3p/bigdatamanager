/**
 * Created by b4p3p on 25/05/15.
 */

var ConstantsRouter = {};

ConstantsRouter.argIndex = function(req, page)
{
    var userProject = '';
    var projectName = '';

    if ( req != null) {
        userProject = req.session.userProject;
        projectName = req.session.projectName;
    }

    if (!page) page = '';

    return {
        userProject: userProject ,
        projectName: projectName,
        page: page,
        tab: '',
        error: {},
        content: {}
    }
};

/**
 *  Constanti delle pagine
 */
ConstantsRouter.PAGE = {
    HOME: "home",
    //PROJECT: "project",
    NEW_PROJECT: "new-project",
    OPEN_PROJECT: "open-project",
    EDIT_PROJECT: "edit-project",
    DATABASE: "database",
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
