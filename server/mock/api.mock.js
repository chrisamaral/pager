'use strict';
var app = require('../base.js')(),
    async = require('async'),
    _ = require('lodash'),
    names = ['Miguel', 'Davi', 'Arthur', 'Gabriel', 'Pedro', 'Lucas', 'Matheus', 'Bernardo', 'Rafael', 'Guilherme', 'Sophia', 'Julia', 'Alice', 'Manuela', 'Isabella', 'Laura', 'Maria Eduarda', 'Giovanna', 'Valentina', 'Beatriz'],
    surnames = ["Silva", "Santos", "Souza", "Oliveira", "Pereira", "Lima", "Carvalho", "Ferreira", "Rodrigues", "Almeida", "Costa", "Gomes", "Martins", "Araújo", "Melo", "Barbosa", "Ribeiro", "Alves", "Cardoso", "Schmitz", "Rocha", "Correia", "Dias", "Teixeira", "Fernandes", "Azevedo", "Cavalcante", "Montes", "Morais", "Gonçalves"],
    workTypes = ['Visita Técnica', 'Instalação', 'Mudança', 'Melhora', 'Desconexão'].map(function(t){return t.toLowerCase();});

app.express
    .get('/:org/api/mock/customers', app.authorized.can('enter app'), function (req, res) {
        var types = ['Corporativo', 'Hotelaria', 'Individual', 'Afiliado', 'Condomínio'],
            init = Date.now(),
            customer,
            c = 0,
            updates = 0,
            inserts = 0,
            p1,
            p2,
            p3,
            name,
            type;

        app.mongo.collection('customer', function (err, customerCollection) {
            if (err) {
                console.log(err);
                return res.send(500);
            }
            async.whilst(
                function () {
                    c += 1;
                    if (c % 10 === 0) { console.log('total customers: ', c, 'updates:', updates, 'inserts:', inserts); }
                    return c < 1000 * 1000;
                },
                function (callback) {

                    p1 = Math.floor(Math.random() * names.length);
                    p2 = Math.floor(Math.random() * surnames.length);
                    p3 = Math.floor(Math.random() * types.length);
                    name = [names[p1], surnames[p2]];
                    type = types[p3];

                    pickRandomAddress(function (err, address) {

                        var formatted_address = address.address,
                            address_components = address.components;

                        if (err) {
                            console.log(err);
                            return res.send(500);
                        }
                        if (Date.now() % 2 === 0) {
                            customerCollection.count(function (err, count) {
                                if (err) {
                                    console.log(err);
                                    return callback(err);
                                }

                                var rnd = Math.floor(Math.random() * count);
                                customerCollection.find({address_components: {$exists: false}}, {skip: rnd, limit: 1}).toArray(function (err, customers) {
                                    if (err) {
                                        console.log(err);
                                        return callback(err);
                                    }
                                    if (!customers || !customers.length) {
                                        return callback();
                                    }

                                    customer = customers[0];
                                    customer.addresses.push({
                                        address: formatted_address,
                                        components: address_components
                                    });
                                    customerCollection.save(customer, function (err, whatnot) {
                                        if (err) {
                                            console.log(err);
                                            return callback(err);
                                        }
                                        updates += 1;
                                        callback();
                                    });
                                });
                            });
                        } else {
                            customer = {
                                sys_id: Math.random().toString(36).substr(2),
                                org: req.params.org,
                                name: name.join(' '),
                                type: type.toLowerCase(),
                                address: formatted_address,
                                addresses: [
                                    {
                                        address: formatted_address,
                                        components: address_components
                                    }
                                ]
                            };

                            customer.creation = new Date();
                            customer.creation.setTime(Date.now() - Math.floor(Math.random() * 365 * 2 * 24 * 60 * 60 * 1000));

                            customerCollection.insert(customer, {w: 1}, function (err, result) {
                                inserts += 1;
                                if (err) {
                                    console.log(err);
                                    return callback(err);
                                }

                                process.nextTick(function () {
                                    callback();
                                });
                            });
                        }
                    });
                },
                function (err) {
                    if (err) {
                        console.log(err);
                        return res.send(500);
                    }
                    res.send(200);
                }
            );
        });
    });

function pickRandomAddress(callback) {
    app.mysql.query('SELECT ' +
        'concat(tp_logradouro," ", logradouro) route, ' +
        'bairro neighbourhood, ' +
        'concat(LEFT(cep, 5),"-",RIGHT(cep, 3)) postal_code, ' +
        'cidade city ' +
        'FROM cep ' +
        'WHERE cep BETWEEN "20000000" AND "28999999" ' +
        'ORDER BY RAND() LIMIT 1',
        function (err, rows) {
            if (err) {
                return callback(err);
            }
            var address, address_components = [], formatted_address;

            if (!rows[0]) {
                return callback('No addresses returned');
            }

            address = rows[0];

            _.forEach(address, function (elem, key) {
                address_components.push({name: key, value: elem});
            });

            address_components.push({name: 'state', value: 'Rio de Janeiro', short: 'RJ'});
            address_components.push({name: 'country', value: 'Brasil'});

            formatted_address = address.route + ' - ' + address.neighbourhood + ', ' +
                    address.city + ' - ' + 'RJ, ' + address.postal_code + ' - Brasil';

            callback(null, {address: formatted_address, components: address_components});

        });
}
app.express
    .get('/:org/api/mock/work_orders', app.authorized.can('enter app'), function (req, res) {

        var customerCollection, workOrderCollection, c = 0;
        async.parallel([
            function (callback) {
                app.mongo.collection('customer', function (err, collection) {
                    if (err) {
                        return callback(err);
                    }
                    customerCollection = collection;
                    callback();
                });
            },
            function (callback) {
                app.mongo.collection('work_order', function (err, collection) {
                    if (err) {
                        return callback(err);
                    }
                    workOrderCollection = collection;
                    callback();
                });
            }
        ], function (err, nope) {
            if (err) {
                console.log(err);
                res.send(500);
            }
            wGenerator();
        });

        function wGenerator() {
            async.waterfall([
                function (callback) {
                    var customer;
                    if (Math.floor(Math.random() * 100) % 3 !== 0) {
                        return customerCollection.count({addresses: {$exists: true}}, function (err, count) {
                            if (err) {
                                return callback(err);
                            }

                            var rnd = Math.floor(Math.random() * count);
                            customerCollection.find({addresses: {$exists: true}}, {skip: rnd, limit: 1}).toArray(function (err, customers) {
                                if (err) {
                                    return callback(err);
                                }
                                if (!customers || !customers.length) {
                                    return callback('No customer returned');
                                }

                                customer = customers[0];
                                delete customer._id;
                                callback(null, customer);
                            });
                        });
                    }
                    callback(null, null);
                },
                function (customer, callback) {
                    function insertWorkOrder(extra, callback) {

                        var types = workTypes,
                            shift = [
                                ['08:00', '11:00'],
                                ['11:00', '13:00'],
                                ['14:00', '17:00'],
                                ['17:00', '20:00'],
                                ['20:00', '23:00']
                            ],
                            myshift,
                            aux,
                            status = ['Finalizado', 'Cancelado', 'Emitida', 'Pendente', 'Suspensa'],
                            workOrder = {
                                sys_id: Math.random().toString(36).substr(2),
                                org: req.params.org,
                                type: types[Math.floor(Math.random() * types.length)].toLowerCase(),
                                status: status[Math.floor(Math.random() * status.length)].toLowerCase()
                            };

                        workOrder.creation = new Date();
                        workOrder.creation.setTime(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

                        if (extra.address) {
                            workOrder.address = extra.address;
                        }

                        if (extra.customer) {
                            workOrder.customer = extra.customer;
                        }

                        if (Math.floor(Math.random() * 100) % 2 === 0) {
                            myshift = shift[Math.floor(Math.random() * shift.length)];

                            workOrder.schedule = {
                                shift: myshift,
                                from: new Date(),
                                to: new Date()
                            };

                            workOrder.schedule.from.setTime(
                                Date.now() -
                                    (
                                        Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)
                                        - Math.floor(Math.random() * 15 * 24 * 60 * 60 * 1000)
                                    )
                            );
                            workOrder.schedule.to.setTime(workOrder.schedule.from.getTime());


                            aux = myshift[0].split(':');
                            workOrder.schedule.from.setHours(parseInt(aux[0], 10), parseInt(aux[1], 10));

                            aux = myshift[1].split(':');
                            workOrder.schedule.to.setHours(parseInt(aux[0], 10), parseInt(aux[1], 10));
                        }

                        workOrderCollection.insert(workOrder, function (err, result) {
                            if (err) {
                                return callback(err);
                            }
                            callback();
                        });
                    }
                    var aux;
                    if (!customer) {
                        pickRandomAddress(function (err, address) {
                            if (err) {
                                return callback(err);
                            }
                            insertWorkOrder({address: address}, callback);
                        });
                    } else {

                        if (customer.addresses) {

                            aux = {address: customer.addresses[0]};

                            if (customer.location) {
                                aux.location = customer.location;
                            }

                            aux.customer = {
                                sys_id: customer.sys_id,
                                name: customer.name,
                                type: customer.type,
                                creation: customer.creation
                            };

                            insertWorkOrder(aux, callback);
                        } else {
                            console.log('customer without address:', customer);
                        }
                    }
                }
            ], function (err, result) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }
                c += 1;
                console.log('total:', c);
                if (c < 1000) {
                    return wGenerator();
                }
                res.send(204);
            });
        }
    });
app.express
    .get('/:org/api/mock/workers', app.authorized.can('enter app'), function (req, res) {
        async.waterfall([
            function(callback) {
                app.mysql.query('SELECT user.id user_id, user.full_name name ' +
                    'FROM active_user ' +
                    'JOIN user ON user.id = active_user.user ' +
                    'ORDER BY RAND() ',
                    function (err, users) {
                        if (err) {
                            return callback(err);
                        }
                        console.log(users.length);
                        callback(null, users);
                    });
            },
            function (users, callback) {
                app.mongo.collection('worker', function (err, workerCollection) {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, users, workerCollection);
                });
            },
            function (users, workerCollection, callback){
                var user,
                    worker,
                    everyone = [],
                    types = workTypes,
                    aux,
                    myTypes,
                    range = _.range(1, types.length + 1);

                while (users.length && everyone.length < 200) {
                    worker = {sys_id: Math.random().toString(36).substr(2)};
                    user = users.splice(0, 1)[0];
                    aux = [];

                    range.forEach(function(num){
                        for (var i = 0; i < (100 / num); i++) {
                            aux.push(num);
                        }
                    });

                    aux = aux[Math.floor(Math.random() * aux.length)];
                    myTypes = [];

                    myTypes = _.sample(types, aux);

                    if (!user || Date.now() % 3 === 0) {
                        user = {
                            name: [names[Math.floor(Math.random() * names.length)],
                                surnames[Math.floor(Math.random() * surnames.length)]].join(' ')
                        };
                    }

                    _.merge(worker, user);

                    worker.types = myTypes;
                    worker.org = req.params.org;

                    everyone.push(worker);
                }

                everyone = _.sample(everyone, 20);
                console.log(everyone);
                workerCollection.insert(everyone, function (err, info){
                    if (err) {
                        return callback(err);
                    }
                    callback(null, null);
                });

            }
        ], function (err, result) {
            if (err) {
                console.log(err);
                return res.send(500);
            }
            res.send(204);
        });
    });