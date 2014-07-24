'use strict';
var app = require('../base.js')(),
    ObjectID = require('mongodb').ObjectID,
    async = require('async'),
    _ = require('lodash'),
    strftime = require('strftime');

require('./api.console.tasks');

/*
    SET WORK ORDER LOCATION
 */

app.express.post('/:org/api/workOrder/:id/location', app.authorized.can('enter app'), function (req, res) {

    if (!req.body || !req.body.lat || !req.body.lng) {
        return res.send(400);
    }

    var id = req.params.id,
        lat = parseFloat(req.body.lat),
        lng = parseFloat(req.body.lng),
        location = {type: 'Point', coordinates: [lng, lat]};

    app.mongo.collection('work_order', function (err, workOrders) {

        if (err) {
            console.log(err);
            res.send(500);
        }

        async.waterfall([

            //atualiza ordem
            function (callback) {
                workOrders.update({_id: new ObjectID(id), org: req.params.org}, {$set: {location: location}}, function () {
                    callback();
                });
            },

            //busca ordem pra verificar se é necessário atualizar coleção clientes
            function (callback) {
                workOrders.findOne({_id: new ObjectID(id), org: req.params.org}, function (err, wo) {

                    if (err) {
                        return callback(err);
                    }

                    if (!wo) {
                        return callback('Not Found');
                    }

                    callback(null, wo);
                });
            },

            //atualiza cliente caso necessário
            function (workOrder, callback) {
                if (!workOrder.customer) {
                    return callback(null, null);
                }

                workOrders.update({'address.address': workOrder.address.address, location: {$exists: false}},
                    {$set: {location: location}}, {multi: true}, function (err, what) {
                        if (err) {
                            console.log(err);
                        }
                        return what;
                    });

                app.mongo.collection('customer', function (err, customers) {

                    if (err) { return callback(err); }

                    customers.update({sys_id: workOrder.customer.sys_id},
                            {$set: {location: location}},
                        function (err) {
                            if (err) { return callback(err); }
                            callback(null, null);
                        });
                });

            }
        ], function (err) {
            if (err) {
                console.log(err);
                res.send(500);
            }
            res.send(204);
        });
    });
});


app.express.get('/:org/api/console/workers/:day',  app.authorized.can('enter app'), function (req, res) {
    //@TODO: filtrar `day`

    app.mongo.collection('worker', function (err, workerCollection) {

        if (err) {
            console.log(err);
            return res.send(500);
        }

        workerCollection.find({org: req.params.org, deleted: {$ne: true}})
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
                                types: worker.types
                            };
                        })
                );
            });
    });
});

app.express.get('/:org/api/console/typeDuration', app.authorized.can('enter app'), function (req, res) {
    var types = req.query.types,
        myTypes = {};

    if (!types || !_.isArray(types)) {
        return res.status(500).send('Tipos inválidos');
    }

    app.mongo.collection('type', function (err, typeCollection) {
        async.eachSeries(types,
            function(type, callback) {
                typeCollection.findOne({name: type, org: req.params.org},
                    {fields: {duration: 1}},

                    function (err, result) {

                        if (err) {
                            return callback(err);
                        }

                        myTypes[type] = result ? result.duration : 30;

                        callback(null);
                    }
                );
            },
            function (err) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                res.json(myTypes);
            }
        );
    });
});

app.express.get('/:org/api/console/routerConfigOptions', app.authorized.can('enter app'), function (req, res) {
    async.parallel({
        workShifts: function (callback) {
            app.mongo.collection('work_shift', function (err, workShiftsCollection) {

                if (err) { return callback(err); }

                workShiftsCollection.find({org: req.params.org}).toArray(function (err, result) {

                    if (err) { return callback(err); }

                    callback(null, result);
                });
            });
        },

        points: function (callback) {
            app.mongo.collection('place', function (err, checkPointCollection) {
                if (err) { return callback(err); }

                checkPointCollection.find({org: req.params.org, tags: 'origin'}).toArray(function (err, result) {

                    if (err) { return callback(err); }

                    callback(null, result.map(function (point) {
                        return {
                            name: point.name,
                            address: point.address,
                            location: {
                                lng: point.location.coordinates[0],
                                lat: point.location.coordinates[1]
                            }
                        };
                    }));

                });
            });
        }

    }, function (err, results) {

        if (err) {
            console.log(err);
            return res.send(500);
        }

        res.json(results);
    });
    /*
    res.json({
        points: [{address: 'Central, Rio de Janeiro', location: {lat: -22.904356, lng: -43.189390}}],
        workShifts: [
            {from: '08:00', to: '17:00'},
            {from: '11:00', to: '20:00'},
            {from: '14:00', to: '23:00'}
        ]
    });*/
});

(function () {

    function autoDate(val) {
        if (!_.isString(val)) { return val; }
        if (!val.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)) { return val; }
        return new Date(val);
    }

    function datefy(x) {
        if (!_.isPlainObject(x) && !_.isArray(x)) { return autoDate(x); }

        _.forEach(x, function (elem, index) {
            x[index] = datefy(elem);
        });

        return x;
    }

    function saveSchedule(worker, callback) {

        worker = datefy(worker);
        worker.day = this.day;
        worker.org = this.org;
        worker.last_update = new Date();

        worker.deleted = false;

        this.collection.findAndModify(
            {worker: worker.worker, org: this.org, day: this.day},
            [['_id', 'asc']],
            {$set: worker},
            {upsert: true, new: true},
            function (err, doc) {

                if (err) { return callback(err); }

                doc.user = this.user;
                doc.timestamp = new Date();

                this.histCollection.update(
                    {_id: new ObjectID(doc._id), org: doc.org},
                    {
                        $set: {org: doc.org},
                        $push: {changes: doc}
                    },
                    {upsert: true},
                    callback
                );


            }.bind(this)
        );
    }

    app.express.post('/:org/api/console/schedule/:day', app.authorized.can('enter app'), function (req, res) {

        var schedule = req.body;

        async.parallel({
            schedule: function (callback) {
                app.mongo.collection('schedule', callback);
            },
            history: function (callback) {
                app.mongo.collection('schedule_history', callback);
            }
        }, function (err, results) {
            if (err) {
                console.log(err);
                return res.send(500);
            }

            async.each(schedule,

                saveSchedule.bind({
                    collection: results.schedule,
                    histCollection: results.history,
                    day: req.params.day,
                    org: req.params.org,
                    user: req.user
                }),

                function (err) {

                    if (err) {
                        console.log(err);
                        return res.send(500);
                    }

                    res.send(204);
                });
        });
    });

}());

app.express.delete('/:org/api/console/schedule/:id', app.authorized.can('enter app'), function (req, res) {

    function ack() {
        app.mongo.collection('schedule_history', function (err, histCollection) {
            if (err) {
                return console.log(err);
            }

            histCollection.update(
                {_id: new ObjectID(req.params.id), org: req.params.org},
                {$push: {changes: {deleted: true, timestamp: new Date(), user: req.user}}},
                function (err) {
                    if (err) { console.log(err); }
                }
            );

        });
    }

    app.mongo.collection('schedule',
        function (err, scheduleCollection) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            scheduleCollection.update({_id: new ObjectID(req.params.id), org: req.params.org},
                {$set: {deleted: true, last_update: new Date()}},
                function (err) {

                    if (err) {
                        console.log(err);
                        return res.send(500);
                    }


                    ack();
                    res.send(204);

                });
        });

});

app.express.delete('/:org/api/console/schedule/:id/tasks', app.authorized.can('enter app'), function (req, res) {
    function ack() {
        app.mongo.collection('schedule_history', function (err, histCollection) {

            if (err) {return console.log(err); }

            histCollection.update(
                {_id: new ObjectID(req.params.id), org: req.params.org},
                {$push: {changes: {tasks: [], work_orders: [], customers: [], timestamp: new Date(), user: req.user}}},
                function (err) {
                    if (err) { console.log(err); }
                }
            );

        });
    }

    app.mongo.collection('schedule',
        function (err, scheduleCollection) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            scheduleCollection.update({_id: new ObjectID(req.params.id), org: req.params.org},
                {$set: {tasks: [], work_orders: [], customers: []}},
                function (err) {

                    if (err) {
                        return res.send(500);
                    }

                    ack();
                    res.send(204);
                });
        });
});

app.express.get('/:org/api/console/schedule/:day', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('schedule',
        function (err, scheduleCollection) {

            if (err) {
                return res.send(500);
            }

            scheduleCollection
                .find({day: req.params.day, org: req.params.org, deleted: {$ne: true}})
                .toArray(function (err, schedule) {

                    if (err) {
                        return res.send(500);
                    }

                    res.json(schedule);
                });
        });
});

app.express.delete('/:org/api/console/schedules/:day', app.authorized.can('enter app'), function (req, res) {
    async.parallel({
        schedule: function (callback) {
            app.mongo.collection('schedule', callback);
        },
        history: function (callback) {
            app.mongo.collection('schedule_history', callback);
        }
    }, function (err, result) {

        if (err) {
            console.log(err);
            return res.send(500);
        }

        var scheduleCollection = result.schedule,
            histCollection = result.history;

        scheduleCollection.find({day: req.params.day, org: req.params.org, deleted: false},
            {fields: {_id: 1}})
            .toArray(function (err, schedules) {

                if (err) {
                    console.log(err);
                    return res.send(500);
                }

                if (!_.isArray(schedules)) {
                    return res.send(204);
                }

                async.eachSeries(schedules,
                    function (schedule, callback) {

                        scheduleCollection.update(
                            {_id: new ObjectID(schedule._id), org: req.params.org},
                            {$set: {deleted: true, last_update: new Date()}},
                            callback
                        );

                        histCollection.update({_id: new ObjectID(schedule._id), org: req.params.org},
                            {$push: {changes: {deleted: true, timestamp: new Date(), user: req.user}}},
                            function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                    },
                    function (err) {

                        if (err) {
                            console.log(err);
                            return res.send(500);
                        }

                        res.send(204);

                    });

            });

    });

});