"use strict";
var app = require('../base.js')();

function defineRoles(done) {
    process.nextTick(function(){
        done();
    });
}

module.exports = function (done) {
    app.authorized = require('authorized');
    app.authorized.role('valid_user', function (req, done) {
        app.mysql.query('SELECT SUM(c) c ' +
            'FROM ( ' +
                'SELECT count(*) c ' +
                'FROM app_user ' +
                'WHERE user = ? AND org = ? AND app = ? ' +
                'UNION ' +
                'SELECT count(*) c '+
                'FROM role_user ' +
                'WHERE user = ? AND ( role = "admin" OR ( role = "org.admin" AND org = ? ) ) ' +
            ') x',
            [req.user.id, req.params.org, app.appID, req.user.id, req.params.org],
            function(err, rows){
                if (err) {
                   return done(err);
                }
                return done(null, rows.length && rows[0].c > 0);
            });

    });

    var final = function () {
        app.authorized.action('enter app', ['valid_user']);
        done();
    };
    defineRoles(final);
};