'use strict';
var app = require('../base.js')(),
    ObjectID = require('mongodb').ObjectID,
    async = require('async'),
    _ = require('lodash');

app.express.get('/:org/api/admin/options', app.authorized.can('enter app'), function (req, res) {
    res.json(_.sortBy([
        {id: 'workers', name: 'Equipes'},
        {id: 'import', name: 'Importar'},
        {id: 'shifts', name: 'Turnos da Agenda'},
        {id: 'work_shifts', name: 'Turnos de Trabalho'},
        {id: 'places', name: 'Pontos Geográficos'},
        {id: 'statuses', name: 'Status de Ordem'},
        {id: 'types', name: 'Tipos de Ordem'}
    ], 'name'));
});
app.express.get('/:org/api/admin/statuses',  app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('status', function (err, statusCollection) {
        if (err) {
            console.log(err);
            return res.send(500);
        }

        statusCollection.find({org: req.params.org}).toArray(function (err, result) {
            if (err) {
                console.log(err);
                return res.send(500);
            }
            res.json(result);
        });

    });
});
app.express.post('/:org/api/admin/status/:name/:ref', app.authorized.can('enter app'), function (req, res) {

    req.params.name = req.params.name.toLowerCase().trim();
    req.params.ref = req.params.ref.toLowerCase().trim();

    app.mongo.collection('status', function (err, statusCollection) {
        statusCollection.update({org: req.params.org, name: req.params.name},
            {$set: {name: req.params.name}, $push: {references: req.params.ref}},
            {upsert: true},
            function (err) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                app.mongo.collection('work_order', function (err, workOrderCollection) {
                    if (err) {
                        console.log(err);
                        return res.send(500);
                    }
                    workOrderCollection.update({org: req.params.org, original_status: req.params.ref},
                        {$set: {status: req.params.name}},
                        {multi: true},
                        function (err) {
                            if (err) {
                                console.log(err);
                                return res.send(500);
                            }
                            res.send(204);
                        }
                    )
                });

            });
    });
});
app.express.delete('/:org/api/admin/status/:name/:ref', app.authorized.can('enter app'), function (req, res) {

    req.params.name = req.params.name.toLowerCase().trim();
    req.params.ref = req.params.ref.toLowerCase().trim();

    app.mongo.collection('status', function (err, statusCollection) {
        statusCollection.update({org: req.params.org, name: req.params.name},
            {$pull: {references: req.params.ref}},
            function (err) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                res.send(204);
            });
    });
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
                                user_id: worker.user_id,
                                types: worker.types || []
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
            workerCollection.update({_id: new ObjectID($id), org: req.params.org}, {$set: worker}, function (err) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                res.send(204);
            });

        } else {
            worker.creation = new Date();
            workerCollection.insert(worker, function (err) {
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
        workerCollection.update({_id: new ObjectID(req.params.id), org: req.params.org}, {$set: {deleted: true}}, {upsert: false}, function (err) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.send(204);
        });
    });
});
var csvImport = require('./api.admin.csv.import');

app.express.post('/:org/api/admin/work_orders', app.authorized.can('enter app'), csvImport.workOrderCSVUploadHandler);

app.express.get('/:org/api/admin/places', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('place',
        function (err, placesCollection) {
            placesCollection.find({org: req.params.org})
                .sort('creation', 1)
                .toArray(function (err, result){

                    if (err) {
                        console.log(err);
                        return res.send(500);
                    }

                    res.json(result.map(function (point) {
                        return {
                            _id: point._id,
                            name: point.name,
                            address: point.address,
                            tags: point.tags || [],
                            location: {
                                lng: point.location.coordinates[0],
                                lat: point.location.coordinates[1]
                            }
                        };
                    }));

                });
        });
});

function savePlace (req, res) {

    var place = req.body.place,
        id = req.params.id;

    app.mongo.collection('place', function (err, placesCollection) {
        function onComplete (err) {
            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.send(204);
        }

        place.org = req.params.org;
        if (place.location) place.location = {type: 'Point', coordinates: [place.location.lng, place.location.lat]};

        if (!id) {
            place.creation = new Date();
            placesCollection.insert(place, onComplete);

        } else {

            placesCollection.update({_id: new ObjectID(id), org: req.params.org}, {$set: place}, onComplete);

        }
    });
}

app.express.post('/:org/api/admin/place', app.authorized.can('enter app'), savePlace);
app.express.post('/:org/api/admin/place/:id', app.authorized.can('enter app'), savePlace);
app.express.delete('/:org/api/admin/place/:id', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('place', function (err, placesCollection) {
        placesCollection.remove({_id: new ObjectID(req.params.id), org: req.params.org}, function (err) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.send(204);
        });
    });
});
app.express.get('/:org/api/admin/types', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('type', function (err, typeCollection) {
        typeCollection.find({org: req.params.org}).toArray(function (err, result) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.json(result);
        });
    });
});

app.express.get('/:org/api/admin/undefined/types', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('work_order', function (err, workerCollection) {
        workerCollection.distinct('type', {org: req.params.org}, function (err, result) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.json(result);
        });
    });
});

app.express.get('/:org/api/admin/undefined/statuses', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('work_order', function (err, workerCollection) {
        workerCollection.distinct('original_status',
            {org: req.params.org, original_status: {$exists: true}, status: 'desconhecido'},
            function (err, result) {

                if (err) {
                    console.log(err);
                    return res.send(500);
                }

                res.json(result);
            });
    });
});

app.express.post('/:org/api/admin/type/:name', app.authorized.can('enter app'), function (req, res) {
    req.params.name = req.params.name.toLowerCase().trim();
    var n_type = req.body.type;
    n_type.org = req.params.org;
    app.mongo.collection('type', function (err, typeCollection) {

        if (err) {
            console.log(err);
            return res.send(500);
        }

        typeCollection.update(
            {org: req.params.org, name: req.params.name},
            {$set: n_type},
            {upsert: true},
            function (err) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                res.send(204);
            })
    });
});
app.express.delete('/:org/api/admin/type/:name', app.authorized.can('enter app'), function (req, res) {
    req.params.name = req.params.name.toLowerCase().trim();
    app.mongo.collection('type', function (err, typeCollection) {
        typeCollection.remove({name: req.params.name, org: req.params.org}, function (err) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.send(204);
        });
    });
});
require('./api.admin.shifts');
require('./api.admin.work_shifts');
