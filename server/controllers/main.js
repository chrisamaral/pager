"use strict";
var app = require('../base.js')(),
    express = require('express'),
    connetFlash = require('connect-flash'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    RedisStore = require('connect-redis')(expressSession),
    sessMaxAge = 1000 * 60 * 60 * 24,
    path = require('path'),
    pub_dir = path.normalize(__dirname + "/../..") + '/media',
    authLib = require('../lib/authorization.js');

app.sessionStore = new RedisStore();
app.express = express();
app.express.use(express.static(pub_dir));
app.express.use(bodyParser());
app.express.use(cookieParser());
app.express.use(connetFlash());
app.express.set('view engine', 'jade');
app.express.set('json spaces', 2);

app.express.use(expressSession({
    secret: 'maiorsegredodomundo',
    key: 'acw.sid',
    cookie: {
        maxAge: sessMaxAge,
        domain: '.' + app.DOMAIN
    },
    store: app.sessionStore
}));

app.avatarObj = function (uid, avatar) {

    if (avatar) {
        return {
            full: app.baseUrl + '/media/u/' + uid + '/1/' + avatar,
            thumb: app.baseUrl + '/media/u/' + uid + '/thumb/' + avatar
        };
    }

    return {
        full: app.baseUrl + '/img/user-large.png',
        thumb: app.baseUrl + '/img/user.png'
    };
};

authLib(function () {
    app.passport = require('passport');

    app.passport.serializeUser(function (user, done) {
        done(null, user.id);
    });

    app.passport.deserializeUser(function (id, done) {
        app.mysql.query(' SELECT user.id, user.short_name, user.full_name, user.avatar ' +
                ' FROM  user ' +
                ' JOIN active_user ON active_user.user = user.id ' +
                ' WHERE user.id = ' + app.mysql.escape(id),
            function (err, rows) {
                if (err) {
                    return done(err);
                }
                if (rows.length) {
                    var user = rows[0];
                    user.avatar = app.avatarObj(user.id, user.avatar);
                    return done(null, user);
                }
                return done(null, false);
            });
    });

    app.express.use(app.passport.initialize());
    app.express.use(app.passport.session());

    app.express.use(function (req, res, next) {
        var url;
        if (!req.isAuthenticated()) {
            req.session.redirect_to = app.appUrl + req.originalUrl;
            if (req.xhr) {
                return res.send(401);
            }
            url = app.baseUrl + '/login';
            return res.status(401).redirect(url);
        }
        next();
    });

    app.express.get('/', function (req, res) {
        app.mysql.query('SELECT app_user.org ' +
            'FROM app_user ' +
            'WHERE app_user.user = ? AND app_user.app = ?',
            [req.user.id, app.appID],
            function (err, rows) {
                if (err) {
                    return res.render('errors/500');
                }

                if (rows.length === 1) {
                    return res.redirect('/' + rows[0].org);
                }

                res.redirect(app.baseUrl + '/home');
            });
    });

    function translateOrg(req, res, isAPI, done) {
        req.isAPICall = isAPI;
        app.mysql.query('SELECT id, abbr, name FROM org WHERE id = ? OR abbr = ?',
            [req.params.org, req.params.org],
            function (err, rows) {

                if (isAPI) {
                    if (err) {
                        return res.send(500);
                    }
                    if (!rows[0]) {
                        return res.send(404);
                    }
                } else {
                    if (err) {
                        return res.status(500).render('errors/500');
                    }
                    if (!rows[0]) {
                        return res.redirect('/');
                    }
                }

                var org = rows[0];
                if (req.params.org.toLowerCase() === org.abbr.toLowerCase()) {
                    return res.redirect('/' + org.id + req.originalUrl.substr(org.abbr.length + 1));
                }

                done(org);
            });
    }

    function renderMainPage(req, res, org) {
        res.locals.isDev = app.ENV === 'development';
        res.locals.pager = {
            user: req.user,
            org: org,
            urls: {
                base: app.baseUrl,
                app: app.appUrl
            }
        };
        res.locals.appData = new Buffer(JSON.stringify(res.locals.pager)).toString('base64');
        res.render('index');
    }

    app.express.get('/:org', app.authorized.can('enter app'), function (req, res) {
        translateOrg(req, res, false, function (org) {
            renderMainPage(req, res, org);
        });
    });

    app.express.get('/:org/*', app.authorized.can('enter app'), function (req, res, next) {

        var remainingUri = req.originalUrl.substr(req.params.org.length + 1, 5),
            isAPI =  remainingUri === '/api/' || remainingUri === '/api';
        translateOrg(req, res, isAPI, function (org) {
            if (isAPI) {
                req.org = org;
                return next();
            }
            renderMainPage(req, res, org);
        });
    });

    require('./api.js');

    app.express.use(function (req, res, next) {

        if (req.isAPICall) {
            return res.send(404);
        }

        res.status(404);
        res.render('errors/404');

    });

    app.express.use(function (err, req, res, next) {

        if (err && err instanceof app.authorized.UnauthorizedError === false) {
            return res.status(500).render('errors/500');
        }

        if (req.isAPICall) {
            return res.send(403);
        }

        res.status(403).render('errors/403');
    });

    app.express.listen(3014);
});