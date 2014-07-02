define(['../ext/strftime'], function (strftime) {
    var BpTspSolver, tsp;
    function Router (day, tasks, workers) {

        var dead = false;
        this.id = Math.random().toString(36).substr(2);
        this.deferred = $.Deferred();

        $.when(
                $.get(pager.build.moduleRoot + '/lib/router.worker.js'),

                $.get(pager.build.moduleRoot + '/ext/crypto.sha1.min.js')

            ).done(function (worker, crypto) {
                //Each argument is an array with the following structure: [ data, statusText, jqXHR ]
                worker = worker[0];
                crypto = crypto[0];

                var blob = new Blob([$('#script_lodash').text(), crypto, worker], {type: 'application/javascript'}),
                    blobURL = window.URL.createObjectURL(blob);

                this.webWorker = new Worker(blobURL);
                window.URL.revokeObjectURL(blobURL);

                this.connectToWorker();
                this.webWorker.postMessage({cmd: 'startRouter', data: {tasks: tasks, workers: workers, day: day}});

            }.bind(this));

        var promise = this.deferred.promise();
        
        this.stopRouter = function () {
            console.groupEnd();
            console.log('Stopping Router...');
            dead = true;
        };

        promise.stopRouter = this.stopRouter;
        this.amIDead = function () {
            return dead;
        };

        return promise;

    }

    Router.prototype.fetchTypes = function (usedTypes) {
        $.get(pager.urls.ajax + 'console/typeDuration', {types: usedTypes})
            .done(function (types) {
                this.webWorker.postMessage({cmd: 'parseTypes', data: types});
            }.bind(this));
    };

    Router.prototype.workerRouteOptimizer = function  (worker, callback) {
        if (this.amIDead()) return;
        var router = this;

        tsp.startOver();
        // Set your preferences
        //tsp.setAvoidHighways(true);
        tsp.setTravelMode(google.maps.DirectionsTravelMode.DRIVING);

        // Add points (by coordinates, or by address).
        // The first point added is the starting location.
        // The last point added is the final destination (in the case of A - Z mode)
        console.group(worker.name);
        tsp.addWaypoint(new google.maps.LatLng(worker.startPoint.lat, worker.startPoint.lng),
            function () {
                console.log('startPoint', worker.startPoint);
            });

        _.forEach(worker.tasks, function (task) {
            tsp.addWaypoint(new google.maps.LatLng(task.location.lat, task.location.lng), function () {
                console.log('new waypoint', task.address.address);
            });
        });

        if (worker.endPoint) {
            tsp.addWaypoint(new google.maps.LatLng(worker.endPoint.lat, worker.endPoint.lng),
                function () {
                    console.log('endPoint', worker.endPoint);
                });
        }

        function onSolved () {
            if (router.amIDead()) return;
            var dir = tsp.getGDirections(),
                order = tsp.getOrder(),
                durations = tsp.getDurations(),
                temp = worker.tasks.concat(),
                skipFirst = !!worker.startPoint,
                skipLast = !(!worker.endPoint && worker.endPoint === null),
                aux,
                sumTime = 0,
                currTask;

            worker.tasks = [];

            for (var i = skipFirst ? 1 : 0; i < (skipLast ? order.length - 1 : order.length); i++) {

                currTask = temp[order[i] - (skipFirst ? 1 : 0)];

                (aux = dir.routes[0])
                    && (aux = aux.legs[worker.tasks.length]);

                if (!aux) continue;

                currTask.directions = {
                    origin: {
                        lat: aux.start_location.lat(),
                        lng: aux.start_location.lng()
                    },
                    distance: aux.distance,
                    duration: aux.duration,
                    schedule: {ini: new Date(), end: new Date()}
                };

                currTask.directions.schedule.ini.setTime(worker.workShift.from.getTime() + sumTime);

                sumTime += aux.duration.value * 1000;
                currTask.directions.schedule.end.setTime(worker.workShift.from.getTime() + sumTime);

                currTask.schedule = currTask.schedule || {};
                currTask.schedule.ini = new Date();
                currTask.schedule.end = new Date();

                currTask.schedule.ini.setTime(worker.workShift.from.getTime() + sumTime);

                sumTime += currTask.duration;
                currTask.schedule.end.setTime(worker.workShift.from.getTime() + sumTime);

                worker.tasks.push(currTask);
            }

            temp = null;
            // If you want the duration matrix that was used to compute the route:

            console.groupEnd();

            worker.drawDirections = function () {

                if (worker.directions) {
                    worker.directions.setMap(null);
                    delete worker.directions;
                    return false;
                }

                worker.directions = new google.maps.DirectionsRenderer({
                    directions: dir,
                    map: pager.console.map,
                    polylineOptions: {strokeColor: worker.color},
                    suppressMarkers: true
                });

                return true;
            };

            worker.cleanDirections = function () {
                if (worker.directions) {
                    worker.directions.setMap(null);
                    delete worker.directions;
                }
            };

            router.deferred.notify('message', 'Calculada rota de ' + worker.name);

            callback();
        }

        if (worker.endPoint || worker.endPoint === null) {
            tsp.solveAtoZ(onSolved);
        } else {
            tsp.solveRoundTrip(onSolved);
        }
    };

    Router.prototype.startTSP = function (workers) {
        if (this.amIDead()) return;
        this.deferred.notify('Iniciando Otimizador de Direções...');

        var router = this, deps = ['../ext/async'];

        if (!BpTspSolver) deps.push('../ext/BpTspSolver');

        require.ensure(deps, function (require) {

            var async = require('../ext/async');

            BpTspSolver = BpTspSolver || require('../ext/BpTspSolver');

            tsp = tsp || new BpTspSolver(pager.console.map, null, function () {
                alert('Ops... Ocorreu um erro e o Roteamento foi abortado.');
                console.log(arguments);
                router.stopRouter();
                router.deferred.reject();
            });

            async.eachSeries(workers,
                router.workerRouteOptimizer.bind(router),
                function (err) {
                    if (err) {
                        throw err;
                    }
                    router.deferred.notify('message', 'Finalizado cálculo de rotas');
                    router.deferred.resolve(workers);
                }
            );
        });
    };

    Router.prototype.connectToWorker = function () {

        this.webWorker.addEventListener('message', function (e) {
            if (this.amIDead()) return;
            switch (e.data.type) {
                case 'progressLog':
                    console.log(e.data.data);
                    break;
                case 'logMessage':
                    this.deferred.notify('message', e.data.data);
                    break;
                case 'assertion':
                    if (pager.isDev) {
                        console.assert(e.data.data[0], e.data.data[1] || 'Assertion failed');
                    }
                    break;
                case 'fetchTypes':
                    this.fetchTypes(e.data.data);
                    break;
                case 'endOfTheLine':
                    this.startTSP(e.data.data);
                    break;
            }
        }.bind(this));

    };

    return Router;
});