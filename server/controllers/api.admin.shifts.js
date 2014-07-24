'use strict';
var app = require('../base.js')(),
    ObjectID = require('mongodb').ObjectID,
    _ = require('lodash');

function saveShift (req, res) {
    var id = req.params.id,
        shift = {
            name: req.body.name,
            from: req.body.from,
            to: req.body.to,
            org: req.params.org
        };

    if (!_.isString(shift.name) || !_.isString(shift.from) || !_.isString(shift.to))
        return res.status(400).send('Dados incompletos');

    function secureTm (val) {

        val = val.match(/\d{2}:\d{2}/);
        if (!val) return false;

        val = val[0];
        if (!val) return false;

        return val;
    }

    shift.from = secureTm(shift.from);
    shift.to = secureTm(shift.to);

    if (!shift.from || !shift.to) return res.status(400).send('Dados incompletos');

    app.mongo.collection('shift', function (err, shiftCollection) {

        if (err) {
            console.log(err);
            return res.send(500);
        }

        if (id) {
            shiftCollection.update({_id: new ObjectID(id), org: req.params.org}, {$set: shift}, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }

                res.send(204);
            });
        } else {

            shift.creation = new Date();
            shiftCollection.insert(shift, function (err, result) {
                if (err) {
                    console.log(err);
                    return res.send(500);
                }

                res.send(204);
            });
        }
    });

}
app.express.post('/:org/api/admin/shift', app.authorized.can('enter app'), saveShift);
app.express.post('/:org/api/admin/shift/:id', app.authorized.can('enter app'), saveShift);
app.express.delete('/:org/api/admin/shift/:id', app.authorized.can('enter app'), function (req, res) {

    app.mongo.collection('shift', function (err, shiftCollection) {

        if (err) {
            console.log(err);
            return res.send(500);
        }

        shiftCollection.remove({_id: new ObjectID(req.params.id), org: req.params.org}, function (err, result) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.send(204);
        });

    });

});

app.express.get('/:org/api/admin/shifts', app.authorized.can('enter app'), function (req, res) {
    app.mongo.collection('shift', function (err, shiftCollection) {
        shiftCollection.find({org: req.params.org}).toArray(function (err, result) {

            if (err) {
                console.log(err);
                return res.send(500);
            }

            res.json(result);

        });
    });
});
