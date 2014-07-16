'use strict';
var app = require('../base.js')(), async = require('async');

app.express.get('/:org/api', app.authorized.can('enter app'), function (req, res) {
    res.json({
        urls:   {
            base: app.baseUrl,
            app: app.appUrl
        },
        org: req.org,
        user: req.user
    });
});

app.express.get('/:org/api/pages', app.authorized.can('enter app'), function (req, res) {
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
                        pages = pages.concat([
                            {
                                id: 'acw_admin',
                                name: 'Gerência',
                                url: app.baseUrl + '/admin'
                            },
                            {
                                id: 'pager_admin',
                                name: 'Administração',
                                url: '/' + req.params.org + '/admin'
                            }
                        ]);
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

app.express.get('/:org/api/k', app.authorized.can('enter app'), function (req, res) {
    res.json(app.ENV === 'development'
        ? {
            google: 'AIzaSyBvh52I1rpU-f1Cj-eNSMJCeiKNT85Da4Y'
        }
        : {
            google: 'AIzaSyBRipkiYUdPOBj6FY-_0PQ02gealXooM8Y'
        }
    );
});

require('./api.console');
require('./api.admin');

if (app.ENV === 'development') {
    require('../mock/api.mock');
}