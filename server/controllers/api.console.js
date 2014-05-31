'use strict';
var app = require('../base.js')(),
    async = require('async'),
    _ = require('lodash'),
    strftime = require('strftime');

app.express.get('/:org/api/console/tasks', app.authorized.can('enter app'), function (req, res) {
    var query = req.query;
    if (!Object.keys(query).length) {
        return res.json([]);
    }

    app.mongo.collection('work_order', function (err, workOrders) {
        if (err) {
            return res.send(500);
        }
        var search = {org: req.params.org, $or: []};

        if (query.address && _.isArray(query.address)) {
            query.address.forEach(function (address) {
                search.$or.push({
                    'address.address': {
                        $regex: new RegExp(address),
                        $options: 'i'
                    }
                });
            });
        }

        if (query.customer_name && _.isArray(query.customer_name)) {
            query.customer_name.forEach(function (customer_name) {
                search.$or.push({
                    'customer.name': {
                        $regex: new RegExp('^' + customer_name),
                        $options: 'i'
                    }
                });
            });
        }


        if (query.schedule && _.isArray(query.schedule)) {
            query.schedule.forEach(function (schedule) {
                var ini = new Date(schedule), end = new Date(schedule), oneDay = 24 * 60 * 60 * 1000;

                ini.setTime(ini.getTime() + oneDay);
                ini.setHours(0);
                end.setTime(ini.getTime() + oneDay);

                search.$or.push({
                    'schedule.from': {$lt: end},
                    'schedule.to': {$gt: ini}
                });
            });
        }
        if (!search.$or.length) {
            return res.json([]);
        }

        workOrders.find(search, {limit: 100}).toArray(function (err, result) {
            if (err) {
                console.log(err);
                return res.send(500);
            }
            if (!_.isArray(result)) {
                return res.json([]);
            }
            var orders = result.map(function (order) {
                var o = {
                    id: order._id,
                    sys_id: order.sys_id,
                    address: order.address,
                    creation: order.creation,
                    attrs: []
                };



                if (order.geo) {
                    o.geo = order.geo;
                }

                o.attrs.push({descr: 'Tipo', value: order.type, relevance: 3});
                o.attrs.push({descr: 'Código Ordem', value: order.sys_id, relevance: 2});
                o.attrs.push({descr: 'Status', value: order.status, relevance: 2});
                o.attrs.push({descr: 'Ingresso', value: strftime('%d/%m/%Y', order.creation)});

                if (order.customer) {
                    o.customer = {id: order.customer.sys_id, name: order.customer.name};
                    o.attrs.push({descr: 'Assinante', value: order.customer.name, relevance: 2});
                    o.attrs.push({descr: 'Tipo Assinante', value: order.customer.type});
                    o.attrs.push({descr: 'Código Assinante', value: order.customer.sys_id});
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
        });
    });
});