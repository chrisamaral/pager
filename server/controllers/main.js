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
    pub_dir = path.normalize(__dirname + "/../..") + '/media';

app.sessionStore = new RedisStore();
app.express = express();
app.express.use(express.static(pub_dir));
app.express.use(bodyParser());
app.express.use(cookieParser());
app.express.use(expressSession({
    secret: 'maiorsegredodomundo',
    key: 'acw.sid',
    cookie: { maxAge: sessMaxAge },
    store: app.sessionStore
}));

app.express.use(connetFlash());
app.express.set('view engine', 'jade');

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
                return done(null, user);
            }
            return done(null, false);
        });
});
app.express.use(app.passport.initialize());
app.express.use(app.passport.session());

app.express.use(function (req, res, next) {
    if (!req.isAuthenticated()) {
        return res.redirect(app.httpProtocol + '://' + app.DOMAIN + '/login');
    }
    res.locals.user = req.user;
    res.locals.title = "I don't know just yet.";
    next();
});

app.express.get('/', function (req, res) {
    res.redirect(app.httpProtocol + app.DOMAIN + req.isAuthenticated() + '/home');
});

app.express.get('/:org', function (req, res) {
    app.mysql.query('SELECT name FROM org WHERE id = ? ', [req.params.org], function (err, rows) {
        if (err) {
            return res.status(500).render('errors/500');
        }
        res.locals.title = 'YOU ARE IN ' + rows[0].name;
        res.render('index');
    });
});

app.express.use(function (req, res, next) {

    if (req.xhr) {
        return res.send(404);
    }

    res.status(404);
    res.render('errors/404');
});

app.express.use(function (err, req, res, next) {

    if (err && err instanceof app.authorized.UnauthorizedError === false) {
        return res.status(500).render('errors/500');
    }

    if (!req.isAuthenticated()) {
        req.session.redirect_to = req.originalUrl;
        if (req.xhr) {
            return res.send(401);
        }
        return res.status(401).redirect('/login');
    }

    if (req.xhr) {
        return res.send(401);
    }

    res.status(401).render('errors/401');
});

app.express.listen(3014);

