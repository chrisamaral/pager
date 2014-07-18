'use strict';
var app = require('../base.js')(),
    ObjectID = require('mongodb').ObjectID,
    async = require('async'),
    _ = require('lodash');

app.express.get('/:org/api/admin/options', app.authorized.can('enter app'), function (req, res) {
    res.json([
        {id: 'workers', name: 'Equipes'},
        {id: 'import', name: 'Importar'},
        {id: 'shifts', name: 'Turnos da Agenda'},
        {id: 'work_shifts', name: 'Turnos de Trabalho'},
        {id: 'places', name: 'Pontos Geográficos'}
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
            workerCollection.update({_id: new ObjectID($id)}, {$set: worker}, function (err, result) {
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
        workerCollection.update({_id: new ObjectID(req.params.id)}, {$set: {deleted: true}}, {upsert: false}, function (err, result) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.send(204);
        });
    });
});

app.express.post('/:org/api/admin/work_orders', app.authorized.can('enter app'), function (req, res) {

    console.log('initialize');

    var multiparty = require('multiparty'),
        form = new multiparty.Form();

    console.log('read form');

    form.parse(req, function (err, formFields, formFiles) {
        console.log('ok');
        if (err) {
            console.log(err);
            return res.status(500).send('Erro ao processar upload.');
        }

        if (!formFiles || !formFiles.csv || !formFiles.csv[0]) {
            return res.status(400).send('Não foi possível ler o arquivo');
        }

        var tmpFile = formFiles.csv[0].path,
            csv = require('ya-csv'),
            reader = csv.createCsvFileReader(tmpFile, {
                columnsFromHeader: true
            });

        reader.addListener('data', function (data) {
            console.log(data);
        });
        res.send(204);
    });

});


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
        function onComplete (err, result) {
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

            placesCollection.update({_id: new ObjectID(id)}, {$set: place}, onComplete);

        }
    });
}

app.express.post('/:org/api/admin/place', app.authorized.can('enter app'), savePlace);
app.express.post('/:org/api/admin/place/:id', app.authorized.can('enter app'), savePlace);
app.express.delete('/:org/api/admin/place/:id', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('place', function (err, placesCollection) {
        placesCollection.remove({_id: new ObjectID(req.params.id)}, function (err, result) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.send(204);
        });
    });
});
app.express.get('/:org/api/admin/types', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('work_order', function (err, workOrderCollection) {
        workOrderCollection.distinct('type', {org: req.params.org}, function (err, result) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.json(result);
        });
    });
});
require('./api.admin.shifts');
require('./api.admin.work_shifts');
