"use strict";
var pageDeps = require('../config/pages.js') || {},
    app = require('../base.js')();

Date.prototype.toYMD = function () {
    return app.strftime('%Y-%m-%d %H:%M:%S', this);
};

function setLocals(req, res, page, view, title) {
    res.locals.title = title;
    res.locals.url = req.url;
    res.locals.user = (req.isAuthenticated()) ? req.user : null;
    res.locals.isDev = (app.ENV === 'development');
    res.locals.jsPath = (app.ENV === 'development') ? 'src' : 'build';
    res.locals.messages = {
        error: req.flash('error'),
        info: req.flash('info')
    };

    var deps = pageDeps.defaults || {js: [], css: []}, n_deps;

    if (page && page !== '/') {
        deps = pageDeps[page] || deps;
    }

    n_deps = {
        js: ((deps.js && deps.js.length)
            ? "['" + deps.js.concat().join("', '") + "']"
            : null),
        css: ((deps.css && deps.css.length)
            ? deps.css.concat()
            : null)
    };

    res.locals.dependencies = n_deps;
    res.render(view);
}

exports.serveIt = function (view, page, req, res) {

    page = (page === '/') ? null : page;

    if (!page) {
        return loadPages(req, res, page, view, null);
    }

    app.db.query("SELECT title FROM page WHERE id = ?", [page], function (err, rows) {
        var title = null;

        if (!err && rows[0] && rows[0].title) {
            title = rows[0].title;
        }

        if (!req.isAuthenticated()) {
            return setLocals(req, res, page, view, title);
        }

        loadPages(req, res, page, view, title);
    });
};

exports.dMY_toDate = function (str) {
    var ds = str.split('/');
    return new Date(
        parseInt(ds[2], 10),
        parseInt(ds[1], 10) - 1,
        parseInt(ds[0], 10),
        0,
        0,
        0
    );
};