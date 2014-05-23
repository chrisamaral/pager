"use strict";
var app = require('../base.js')();

var express = require('express'),
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

function dumpSession(header) {
    return function (req, res, next) {
        console.log('#################', header, '###############');
        console.log(req.cookies, req.session, req.user, req.sessionID);
        next();
    };
}

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

    app.express.get('/', app.authorized.can('enter app'), function (req, res) {
        app.mysql.query('SELECT org.id org ' +
            'FROM app_user ' +
            'JOIN org_app ON org_app.id = app_user.org_app ' +
            'JOIN org ON org.id = org_app.org ' +
            'WHERE app_user.user = ?',
            [req.user.id],
            function (err, rows) {
                if (err) {
                    console.log(err);
                    return res.render('errors/500');
                }

                if (rows.length === 1) {
                    return res.redirect('/' + rows[0].org);
                }

                res.redirect(app.baseUrl + '/home');
            });
    });
    function renderMainPage(req, res){
        app.mysql.query('SELECT id, abbr, name FROM org WHERE id = ? ', [req.params.org], function (err, rows) {
            if (err) {
                return res.status(500).render('errors/500');
            }

            res.locals.isDev = app.ENV === 'development';
            res.locals.pager = {
                user: req.user,
                org: rows[0],
                urls: {
                    base: app.baseUrl,
                    app: app.appUrl
                }
            };
            res.locals.appData = new Buffer(JSON.stringify(res.locals.pager)).toString('base64');

            res.render('index');
        });
    }
    app.express.get('/:org', app.authorized.can('enter app'), function (req, res) {
        renderMainPage(req, res);
    });
    app.express.get('/:org/*', app.authorized.can('enter app'), function (req, res, next) {

        var org = req.params.org;

        if (req.originalUrl.substr(org.length + 1, 5) === '/api/') {
            return next();
        }

        renderMainPage(req, res);
    });
    require('./boot.js');
    app.express.use(function (req, res, next) {
        if (req.xhr) {
            return res.send(404);
        }
        res.status(404);
        res.render('errors/404');
    });

    app.express.use(function (err, req, res, next) {
        var url;
        if (err && err instanceof app.authorized.UnauthorizedError === false) {
            console.log(err);
            return res.status(500).render('errors/500');
        }

        if (!req.isAuthenticated()) {
            req.session.redirect_to = app.appUrl + req.originalUrl;
            if (req.xhr) {
                return res.send(401);
            }
            url = app.baseUrl + '/login';
            return res.status(401).redirect(url);
        }

        if (req.xhr) {
            return res.send(403);
        }

        res.status(403).render('errors/403');
    });

    app.express.listen(3014);
});