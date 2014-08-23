'use strict';
var app = require('../base.js')(),
    async = require('async'),
    _ = require('lodash'),
    moment = require('moment');

function workOrderFormat (order) {
    var o = {
        _id: order._id,
        sys_id: order.sys_id,
        address: order.address,
        creation: order.creation,
        type: order.type,
        attrs: order.attrs && _.isArray(order.attrs) ? order.attrs : []
    }, target;



    if (order.location) {
        o.location = {
            lng: order.location.coordinates[0],
            lat: order.location.coordinates[1]
        };
    }

    if (order.type) {
        o.attrs.push({descr: 'Tipo', value: order.type, relevance: 3});
    }

    o.attrs.push({descr: 'Código Ordem', value: order.sys_id, relevance: 2});

    if (order.status) {
        o.attrs.push({descr: 'Status', value: order.status, relevance: 2});
    }

    if (order.creation) {
        o.attrs.push({descr: 'Ingresso', value: order.creation});
    }

    target = order.customer || order.asset;

    if (target) {

        o.ref = order.customer ? 'customer' : 'asset';
        o.target = target;

        o.attrs.push({descr: order.customer ? 'Cliente' : 'Equipamento',
            value: target.name, relevance: 2});

        if (target.type) {
            o.attrs.push({descr: order.customer ? 'Tipo Cliente' : 'Tipo Equipamento',
                value: target.type});
        }

        o.attrs.push({descr: order.customer ? 'Código Cliente' : 'Código Equipamento',
            value: target.sys_id});

    }

    if (order.schedule && order.schedule.date) {

        order.schedule.from = new Date();
        order.schedule.to = new Date();

        if (order.schedule.shift && _.isArray(order.schedule.shift)) order.schedule.shift = {from: order.schedule.shift[0], to: order.schedule.shift[1]};

        if (order.schedule.shift) {

            order.schedule.from = new Date(
                order.schedule.date.getFullYear(),
                order.schedule.date.getMonth(),
                order.schedule.date.getDate(),
                parseInt(order.schedule.shift.from.split(':')[0], 10),
                parseInt(order.schedule.shift.from.split(':')[1], 10),
                0,0
            );

            order.schedule.to = new Date(
                order.schedule.date.getFullYear(),
                order.schedule.date.getMonth(),
                order.schedule.date.getDate(),
                parseInt(order.schedule.shift.to.split(':')[0], 10),
                parseInt(order.schedule.shift.to.split(':')[1], 10),
                0,0
            );

        } else {

            order.schedule.from = new Date(
                order.schedule.date.getFullYear(),
                order.schedule.date.getMonth(),
                order.schedule.date.getDate(),
                0,
                0,
                0,0
            );

            order.schedule.to = new Date(
                order.schedule.date.getFullYear(),
                order.schedule.date.getMonth(),
                order.schedule.date.getDate(),
                23,
                59,
                59,0
            );
        }

        o.schedule = {from: order.schedule.from, to: order.schedule.to};

        if (order.schedule.shift) {

            o.attrs.push({
                descr: 'Agenda',
                value: order.schedule.date
            });

            o.attrs.push({
                descr: 'Turno',
                value: order.schedule.shift.from + ' <> ' + order.schedule.shift.to
            });

        } else {

            o.attrs.push({
                descr: 'Agenda',
                value: order.schedule.date
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
                    //day: req.params.day,
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

                var ini = moment(new Date(schedule)).toDate();
                var end = moment(new Date(schedule)).add(1, 'd').toDate();

                aux.$or.push({'schedule.date': {$lte: end, $gt: ini}});

            });
            search.$and.push(aux);
        }

        if (notEmptyArray(query.creation)) {
            aux = {$or: []};
            query.creation.forEach(function (creation) {
                var ini = moment(new Date(creation)).toDate();
                var end = moment(new Date(creation)).add(1, 'd').toDate();

                aux.$or.push({'creation': {$lte: end, $gt: ini}});
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