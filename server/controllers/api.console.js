'use strict';
var app = require('../base.js')(),
    async = require('async'),
    _ = require('lodash'),
    strftime = require('strftime');

function formatTasks(req, res) {
    return function (err, result) {
        if (err) {
            console.log(err);
            return res.send(500);
        }
        if (!_.isArray(result)) {
            return res.json([]);
        }
        var orders = result.map(function (order) {
            var o = {
                _id: order._id,
                sys_id: order.sys_id,
                address: order.address,
                creation: order.creation,
                type: order.type,
                attrs: []
            }, target;



            if (order.location) {
                o.location = {
                    lng: order.location.coordinates[0],
                    lat: order.location.coordinates[1]
                };
            }

            o.attrs.push({descr: 'Tipo', value: order.type, relevance: 3});
            o.attrs.push({descr: 'Código Ordem', value: order.sys_id, relevance: 2});
            o.attrs.push({descr: 'Status', value: order.status, relevance: 2});
            o.attrs.push({descr: 'Ingresso', value: strftime('%d/%m/%Y', order.creation)});

            target = order.customer || order.asset;

            if (target) {

                o.ref = order.customer ? 'customer' : 'asset';
                o.target = {sys_id: target.sys_id, name: target.name};

                o.attrs.push({descr: order.customer ? 'Cliente' : 'Equipamento',
                    value: target.name, relevance: 2});

                o.attrs.push({descr: order.customer ? 'Tipo Cliente' : 'Tipo Equipamento',
                    value: target.type});

                o.attrs.push({descr: order.customer ? 'Código Cliente' : 'Código Equipamento',
                    value: target.sys_id});

            }

            if (order.schedule && order.schedule.from && order.schedule.to) {
                o.schedule = {from: order.schedule.from, to: order.schedule.to};

                if (order.schedule.shift) {

                    o.attrs.push({
                        descr: 'Agenda',
                        value: strftime('%d/%m/%Y', order.schedule.from)
                    });

                    o.attrs.push({
                        descr: 'Turno',
                        value: order.schedule.shift.join(' <> ')
                    });

                } else {

                    o.attrs.push({
                        descr: 'Agenda',
                        value: strftime('%d/%m/%Y %R', order.schedule.from) + ' <> ' + strftime('%d/%m/%Y %R', order.schedule.to)
                    });

                }
            }

            o.attrs.push({value: o.address.address});

            return o;
        });

        res.json(orders);
    };
}

app.express.get('/:org/api/console/tasks', app.authorized.can('enter app'), function (req, res) {
    var query = req.query, oneDay = 24 * 60 * 60 * 1000;
    if (!Object.keys(query).length) {
        return res.json([]);
    }

    app.mongo.collection('work_order', function (err, workOrders) {
        if (err) {
            return res.send(500);
        }
        var search = {org: req.params.org, $and: []}, aux, notEmptyArray = function(a){
            return a && _.isArray(a) && a.length;
        };

        if (notEmptyArray(query.address)) {
            aux = {$or: []};
            query.address.forEach(function (address) {
                aux.$or.push({
                    'address.address': {
                        $regex: new RegExp(address),
                        $options: 'i'
                    }
                });
            });
            search.$and.push(aux);
        }

        if (notEmptyArray(query.customer_name)) {
            aux = {$or: []};
            query.customer_name.forEach(function (customer_name) {
                aux.$or.push({
                    'customer.name': {
                        $regex: new RegExp('^' + customer_name),
                        $options: 'i'
                    }
                });
            });
            search.$and.push(aux);
        }


        if (notEmptyArray(query.schedule)) {
            aux = {$or: []};
            query.schedule.forEach(function (schedule) {
                var ini = new Date(schedule), end = new Date(schedule);

                ini.setTime(ini.getTime() + oneDay);
                ini.setHours(0);
                end.setTime(ini.getTime() + oneDay);

                aux.$or.push({
                    'schedule.from': {$lt: end},
                    'schedule.to': {$gt: ini}
                });
            });
            search.$and.push(aux);
        }

        if (notEmptyArray(query.creation)) {
            aux = {$or: []};
            query.creation.forEach(function (creation) {
                var ini = new Date(creation), end = new Date(creation);

                ini.setTime(ini.getTime() + oneDay);
                ini.setHours(0);
                end.setTime(ini.getTime() + oneDay);

                aux.$or.push({creation: {$gt: ini, $lt: end}});
            });
            search.$and.push(aux);
        }

        if (notEmptyArray(query.task_id)) {
            aux = {$or: []};
            query.task_id.forEach(function (task_id) {
                aux.$or.push({sys_id: task_id});
            });
            search.$and.push(aux);
        }

        if (notEmptyArray(query.customer_id)) {
            aux = {$or: []};
            query.customer_id.forEach(function (customer_id) {
                aux.$or.push({'customer.sys_id': customer_id});
            });
            search.$and.push(aux);
        }

        if (notEmptyArray(query.task_status)) {
            aux = {$or: []};
            query.task_status.forEach(function (task_status) {
                aux.$or.push({status: task_status.toLowerCase()});
            });
            search.$and.push(aux);
        }

        if (notEmptyArray(query.task_type)) {
            aux = {$or: []};
            query.task_type.forEach(function (task_type) {
                aux.$or.push({type: task_type.toLowerCase()});
            });
            search.$and.push(aux);
        }

        if (!search.$and.length) {
            return res.json([]);
        }

        workOrders.find(search, {limit: 300}).toArray(formatTasks(req, res));
    });
});

app.express.post('/:org/api/workOrder/:id/location', app.authorized.can('enter app'), function (req, res) {

    if (!req.body || !req.body.lat || !req.body.lng) {
        return res.send(400);
    }

    var id = req.params.id,
        ObjectID = require('mongodb').ObjectID,
        lat = parseFloat(req.body.lat),
        lng = parseFloat(req.body.lng),
        location = {type: 'Point', coordinates: [lng, lat]};

    app.mongo.collection('work_order', function (err, workOrders) {
        async.waterfall([

            //atualiza ordem
            function (callback) {
                workOrders.update({_id: ObjectID(id)}, {$set: {location: location}}, function () {
                    callback();
                });
            },

            //busca ordem pra verificar se é necessário atualizar coleção clientes
            function (callback) {
                workOrders.findOne({_id: ObjectID(id)}, function (err, wo) {

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
        workerCollection.find({org: req.params.org})
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
                .find({day: req.params.day, org: req.params.org})
                .toArray(function (err, schedule) {
                    if (err) return res.send(500);
                    res.json(schedule);
                });
        }
    );
});