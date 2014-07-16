'use strict';
var app = require('../base.js')(),
    ObjectID = require('mongodb').ObjectID,
    async = require('async'),
    _ = require('lodash');

app.express.get('/:org/api/admin/options', app.authorized.can('enter app'), function (req, res) {
    res.json([
        {id: 'workers', name: 'Equipes'},
        {id: 'import', name: 'Importar'}
    ]);
});

app.express.get('/:org/api/admin/workers',  app.authorized.can('enter app'), function (req, res) {

    app.mongo.collection('worker', function (err, workerCollection) {
        if (err) {
            console.log(err);
            return res.send(500);
        }
        workerCollection.find({org: req.params.org, deleted: {$ne: true}})
            .sort('creation', 1)
            .toArray(function (err, ws) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                res.json(
                    _.map(ws,
                        function (worker) {
                            return {
                                _id: worker._id,
                                name: worker.name,
                                sys_id: worker.sys_id,
                                user_id: worker.user_id
                            };
                        }
                    )
                );
            });
    });
});

app.express.get('/:org/api/admin/users',  app.authorized.can('enter app'), function (req, res) {
    app.mysql.query('SELECT user.id, user.full_name name ' +
        'FROM user ' +
        'JOIN active_user ON user.id = active_user.user ' +
        'JOIN app_user ON active_user.user = app_user.user AND app_user.org = ? and app_user.app = ? ',
        [req.params.org, app.appID],
        function (err, users) {
            if (err) {
                console.log(err);
                return res.send(500);
            }
            res.json(users);
        });
});

function saveWorker (req, res) {
    var worker = req.body.worker,
        $id = worker._id;

    worker.org = req.params.org;
    _.forEach(worker, function (item, key){
        if (item === '') delete worker[key];
    });


    app.mongo.collection('worker', function (err, workerCollection) {

        if ($id) {

            delete worker._id;
            workerCollection.update({_id: ObjectID($id)}, {$set: worker}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                res.send(204);
            });

        } else {
            worker.creation = new Date();
            workerCollection.insert(worker, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                res.send(204);
            });

        }
    });
}

app.express.post('/:org/api/admin/worker/:id', app.authorized.can('enter app'), saveWorker);
app.express.post('/:org/api/admin/worker', app.authorized.can('enter app'), saveWorker);
app.express.delete('/:org/api/admin/worker/:id', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('worker', function (err, workerCollection) {
        workerCollection.update({_id: ObjectID(req.params.id)}, {$set: {deleted: true}}, {upsert: false}, function (err, result) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.send(204);
        });
    });
});