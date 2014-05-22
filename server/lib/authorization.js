"use strict";
var app = require('../base.js')();
function defineRoles(done) {
    done();
}
module.exports = function (done) {
    app.authorized = require('authorized');
    app.authorized.role('logged_user', function (req, done) {
        done(null, req.isAuthenticated());
    });

    var final = function () {
        app.authorized.action('enter app', ['logged_user']);
        done();
    };
    defineRoles(final);
};