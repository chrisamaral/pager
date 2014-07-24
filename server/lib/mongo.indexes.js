
module.exports = function (mongo) {
    function handleErr (err, nope) {
        if (err) console.log(err);
    }

    var collections;

    collections = ['customer', 'work_order', 'place'];

    collections.forEach(function (collection) {
        mongo.ensureIndex(collection, {location: '2dsphere'}, handleErr);
    });

    mongo.ensureIndex('schedule', {'worker._id': 1}, handleErr);
    mongo.ensureIndex('schedule', {work_orders: 1}, handleErr);
    mongo.ensureIndex('schedule', {customers: 1}, handleErr);
    mongo.ensureIndex('schedule', {day: 1}, handleErr);

    collections = ['customer', 'work_order', 'worker'];
    collections.forEach(function (collection) {
        mongo.ensureIndex(collection, {sys_id: 1, org: 1}, {unique: true}, handleErr);
    });


    collections = ['status', 'type', 'shift', 'work_shift'];
    collections.forEach(function (collection) {
        mongo.ensureIndex(collection, {name: 1, org: 1}, {unique: true}, handleErr);
    });

    collections = ['customer', 'place', 'schedule', 'shift', 'status', 'type', 'work_order', 'work_shift', 'worker'];
    collections.forEach(function (collection) {
        mongo.ensureIndex(collection, {org: 1}, handleErr);
    });


};