'use strict';
var app = require('../base.js')(), async = require('async');
app.express.get('/:org/pages', app.authorized.can('enter app'), function (req, res) {
    /*
        {name: 'Início', url: app.baseUrl + '/home'},
        {name: 'Sair', url: app.baseUrl + '/logout'},
        {name: 'Usuário', url: app.baseUrl + '/user'}
    */
    var pages = [];
    async.parallel([
        function (callback) {
            app.mysql.query('SELECT count(*) c ' +
                'FROM role_user ' +
                'WHERE user = ? ' +
                'AND ( role = "admin" ' +
                'OR (role = "org.admin" AND org = ?) )',
                [req.user.id, req.params.org],
                function (err, rows) {
                    if (err) {
                        return callback(err);
                    }
                    if (rows.length && rows[0].c > 0) {
                        pages = pages.concat([{
                            name: 'Administração',
                            url: app.baseUrl + '/admin'
                        }/*, {name: 'Configurações',url: '/settings'}*/]);
                    }

                    callback();
                });
        }],
        function (err, result) {
            if (err) {
                res.send(500);
            }
            res.json(pages.sort(function (a, b) {
                return a.name < b.name ? -1 : 1;
            }));
        });
});