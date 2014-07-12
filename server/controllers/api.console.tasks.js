'use strict';
var app = require('../base.js')(),
    async = require('async'),
    _ = require('lodash'),
    strftime = require('strftime');

function workOrderFormat (order) {
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
        o.target = target;

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
}
function formatTasks(req, res) {
    return function (err, result) {
        if (err) {
            console.log(err);
            return res.send(500);
        }
        if (!_.isArray(result)) {
            return res.json([]);
        }

        app.mongo.collection('schedule', function (err, scheduleCollection) {
            if (err) {
                console.log(err);
                return res.send(500);
            }

            async.filter(result, function (order, callback) {
                var query = {
                    org: req.params.org,
                    day: req.params.day,
                    deleted: {$ne: true},
                    work_orders: '' + order._id
                };

                scheduleCollection.count(query,
                    function (err, count) {

                        if (err) {
                            console.log(err);
                            return callback(false);
                        }

                        callback(count === 0);
                    });

            }, function (result) {

                res.json(result.map(workOrderFormat));
            });
        });

    };
}

app.express.get('/:org/api/console/tasks/:day', app.authorized.can('enter app'), function (req, res) {
    var query = req.query, oneDay = 24 * 60 * 60 * 1000;
    if (!Object.keys(query).length) {
        return res.json([]);
    }

    app.mongo.collection('work_order', function (err, workOrders) {

        if (err) {
            return res.send(500);
        }

        var search = {org: req.params.org, $and: []}, aux, notEmptyArray = function (a) {
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