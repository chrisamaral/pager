'use strict';
var app = require('../base.js')(),
    $mongo = require('mongodb'),
    strftime = require('strftime'),
    ObjectID = $mongo.ObjectID,
    async = require('async'),
    _ = require('lodash');


function lameSanitize (row) {

    var newRow = {};

    _.forEach(row, function (val, key) {
        if (!val || val === '' || !key || key === '') return;
        newRow[key.toLowerCase().trim()] = _.isString(val) ? val.toLowerCase().trim() : val;
    });

    return newRow;
}

function wOParse (row, shifts, statuses) {
    var newRow = {}, addrComponents = {};

    _.forEach(row, function (val, key) {

        var guess = null;

        if (key.indexOf('cliente') >= 0 || key.indexOf('assinante') >= 0) {


            if (key.indexOf('código') >= 0 || key.indexOf('codigo') >= 0 || key.indexOf('id') >= 0) {
                guess = 'customer.sys_id';
            }

            if (key.indexOf('nome') >= 0) guess = 'customer.name';
            if (key.indexOf('tipo') >= 0) guess = 'customer.type';
            if (key.indexOf('criacao') >= 0 || key.indexOf('criação') >= 0 || key.indexOf('ingresso') >= 0) {
                guess = 'customer.creation';
            }

        }

        if (key === 'cidade') guess = 'address.city';
        if (key === 'bairro') guess = 'address.neighbourhood';
        if (key === 'estado' || key === 'uf') guess = 'address.state';
        if (key === 'cep') guess = 'address.postal_code';
        if (key === 'pais' || key === 'país') guess = 'address.country';
        if (key === 'endereço' || key === 'endereco' || key === 'logradouro') guess = 'address.route';

        if (key === 'tipo') guess = 'type';
        if (key === 'status') guess = 'status';
        if (key === 'criacao' || key === 'criação' || key === 'ingresso') guess = 'creation';
        if (key === 'código' || key === 'codigo' || key === 'id') guess = 'sys_id';

        if (key.indexOf('agenda') >= 0) {
            if (key.indexOf('turno') >= 0 || key.indexOf('janela') >= 0 || key.indexOf('periodo') >= 0) {
                guess = 'schedule.shift';
            } else {
                guess = 'schedule.date';
            }
        }

        switch (guess) {
            case 'creation':
                newRow.creation = new Date(val);
                newRow.creation_day = strftime('%Y-%m-%d', newRow.creation);
                break;
            case 'sys_id':
            case 'type':
                newRow[guess] = val;
                break;
            case 'status':
                var myS = _.find(statuses, function (s){ return s.name === val || s.references.indexOf(val) >= 0; });
                newRow.status = myS ? myS.name : 'desconhecido';
                newRow.original_status = val;

                break;

            case 'schedule.date':
                newRow.schedule = newRow.schedule || {};
                newRow.schedule.date = new Date(val);
                newRow.schedule.day = strftime('%Y-%m-%d', newRow.schedule.date);

                break;
            case 'schedule.shift':

                newRow.schedule = newRow.schedule || {};
                var shift = _.find(shifts, function (s){ return s.name.toLowerCase() === val; });

                if (shift) newRow.schedule.shift = shift;
                break;

            case 'address.route':
            case 'address.postal_code':
            case 'address.neighbourhood':
            case 'address.city':
            case 'address.state':
            case 'address.country':

                var component = guess.split('.')[1];

                addrComponents[component] = val;

                newRow.address = newRow.address || {components: []};
                newRow.address.components.push({name: component, value: val});

                break;

            case 'customer.sys_id':
            case 'customer.name':
            case 'customer.type':
                var component = guess.split('.')[1];
                newRow.customer = newRow.customer || {};
                newRow.customer[component] = val;
                break;

            case 'customer.creation':
                newRow.customer = newRow.customer || {};
                newRow.customer.creation = new Date(val);

                break;


            default:

                newRow.attrs = newRow.attrs || [];
                newRow.attrs.push({descr: key, value: val});

                break;
        }

    });

    if (!newRow.address) return null;

    var fmtAddress = [];
    if (addrComponents.route) fmtAddress.push(addrComponents.route);
    if (addrComponents.neighbourhood) fmtAddress.push(addrComponents.neighbourhood);
    if (addrComponents.city) fmtAddress.push(addrComponents.city);

    if (!fmtAddress.length) return null;
    newRow.address.address = fmtAddress.join(', ');

    return newRow;
}
function workOrderHandler (Handler) {

    async.parallel({
            status: function (callback) {
                app.mongo.collection('status', callback);
            },
            shift: function (callback) {
                app.mongo.collection('shift', callback);
            },
            work_order: function (callback) {
                app.mongo.collection('work_order', callback);
            },
            customer: function (callback) {
                app.mongo.collection('customer', callback);
            }
        }

    , function (err, result) {
        var workOrderCollection = result.work_order,
            customerCollection = result.customer,
            shiftCollection = result.shift,
            statusCollection = result.status;

        Handler(function (org, row, callback) {
            async.waterfall([
                function getStatuses (callback) {
                    statusCollection.find({org: org}).toArray(callback);
                },
                function getShifts (statuses, callback) {
                    shiftCollection.find({org: org}).toArray(function (err, result) {
                        if (err) return callback(err);
                        callback(null, statuses, result);
                    });
                },
                function parseRow (statuses, shifts, callback) {

                    if (!_.isObject(row)) return callback('Inválido');

                    row = lameSanitize(row);
                    if (!row) return callback('Erro na formatação dos dados');

                    row = wOParse(row, shifts, statuses);
                    if (!row) return callback('Erro na interpretação dos dados');

                    row.org = org;
                    if (row.customer) row.customer.org = org;

                    callback(null, row);

                },
                function upsertCustomer (row, callback) {
                    if (row.customer && row.customer.sys_id) {
                        customerCollection.update(
                            {sys_id: row.customer.sys_id, org: org},
                            {$set: _.merge({}, row.customer, {address: row.address})},
                            {upsert: true},
                            function (err, result) {
                                if (err) return callback(err);

                                customerCollection.findOne({sys_id: row.customer.sys_id, org: org},
                                    function (err, result) {
                                        if (err) return callback(err);
                                        row.customer._id = result._id;
                                        callback(null, row);
                                    });
                            });
                    } else {
                        callback(null, row);
                    }
                },
                function upsertWorkOrder (row, callback) {
                    workOrderCollection.update({sys_id: row.sys_id, org: org},
                        {$set: row}, {upsert: true}, callback);
                }

            ], function (err, result) {
                if (err) {
                    console.log(err); return callback(err);
                }
                callback(null, !!result);
            });
        });
    });

}
exports.workOrderCSVUploadHandler = function (req, res) {

    var multiparty = require('multiparty'),
        form = new multiparty.Form();

    form.parse(req, function (err, formFields, formFiles) {

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

        workOrderHandler(function(Handler){
            var rows = 0,
                parsedRows = 0,
                validRows = 0,
                EOF = false;
            reader.addListener('data', function (row) {
                rows++;
                Handler(req.params.org, row, function (err, success) {
                    parsedRows++;
                    if (!err && success) validRows++;
                    if (rows === parsedRows && EOF) answer();
                });
            });

            reader.addListener('end', function () {
                EOF = true;
            });

            function answer () {
                res.send(rows + ' linhas processadas, ' + validRows + ' ordens inseridas/atualizadas.');
            }
        });

    });

};