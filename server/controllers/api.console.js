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
        async.waterfall([

            //atualiza ordem
            function (callback) {
                workOrders.update({_id: new ObjectID(id)}, {$set: {location: location}}, function () {
                    callback();
                });
            },

            //busca ordem pra verificar se é necessário atualizar coleção clientes
            function (callback) {
                workOrders.findOne({_id: new ObjectID(id)}, function (err, wo) {

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
                    customers.update({sys_id: workOrder.customer.sys_id},
                            {$set: {location: location}},
                        function (err, info) {
                            if (err) {
                                return callback(err);
                            }
                            callback(null, null);
                        });
                });

            }
        ], function (err, result) {
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
                        }
                    )
                );
            });
    });
});

app.express.get('/:org/api/console/typeDuration', app.authorized.can('enter app'), function (req, res) {
    var types = req.query.types,
        duration = {

        }, myTypes = {};

    if (!types || !_.isArray(types)) {
        return res.status(500).send('Tipos inválidos');
    }

    types.forEach(function (type) {
        myTypes[type] = duration[type] || _.sample([30, 45, 60]);
    });

    res.json(myTypes);
});

app.express.get('/:org/api/console/routerConfigOptions', app.authorized.can('enter app'), function (req, res) {
    res.json({
        points: [{address: 'Central, Rio de Janeiro', location: {lat: -22.904356, lng: -43.189390}}],
        workShifts: [
            {from: '08:00', to: '17:00'},
            {from: '11:00', to: '20:00'},
            {from: '14:00', to: '23:00'}
        ]
    });
});

(function(){

    function autoDate (val) {
        if (!_.isString(val)) return val;
        if (!val.match(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/)) return val;
        return new Date(val);
    }

    function datefy(x){
        if (!_.isPlainObject(x) && !_.isArray(x)) return autoDate(x);

        _.forEach(x, function(elem, index){
            x[index] = datefy(elem);
        });

        return x;
    }

    function saveSchedule (worker, callback) {

        worker = datefy(worker);
        worker.day = this.day;
        worker.org = this.org;

        this.collection.update(
            {worker: worker.worker, org: this.org, day: this.day},
                worker, {upsert: true, multi: false, safe: true}, callback);
    }

    app.express.post('/:org/api/console/schedule/:day', app.authorized.can('enter app'), function (req, res) {

        var schedule = req.body;

        app.mongo.collection('schedule',
            function (err, scheduleCollection) {

                if (err) {
                    console.log(err);
                    return res.send(500);
                }

                async.each(schedule,

                    saveSchedule.bind({
                        collection: scheduleCollection,
                        day: req.params.day,
                        org: req.params.org
                    }),

                    function (err) {

                        if (err) {
                            console.log(err);
                            return res.send(500);
                        }

                        res.send(204);
                    }
                );
            }
        );
    });

}());

app.express.get('/:org/api/console/schedule/:day', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('schedule',
        function (err, scheduleCollection) {

            if (err) return res.send(500);

            scheduleCollection
                .find({day: req.params.day, org: req.params.org, deleted: {$ne: true}})
                .toArray(function (err, schedule) {
                    if (err) return res.send(500);
                    res.json(schedule);
                });
        }
    );
});

app.express.delete('/:org/api/console/schedule/:day', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('schedule',
        function (err, scheduleCollection) {

            if (err) return res.send(500);

            scheduleCollection.update(
                {day: req.params.day, org: req.params.org},
                {$set: {deleted: true}},
                {multi: true},

                function (err) {

                    if (err) return res.send(500);

                    res.send(204);

                });
        }
    );
});