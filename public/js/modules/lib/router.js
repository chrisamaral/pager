define(['../ext/strftime'], function (strftime) {
    var BpTspSolver, tsp;

    function Router (day, tasks, workers, options) {

        var dead = false;
        this.id = Math.random().toString(36).substr(2);
        this.deferred = $.Deferred();


        $.get(pager.build.moduleRoot + '/lib/router.worker.js')
        .done(function (worker) {

            var blob = new Blob([$('#script_lodash').text(), worker], {type: 'application/javascript'}),
                blobURL = window.URL.createObjectURL(blob);

            this.webWorker = new Worker(blobURL);
            window.URL.revokeObjectURL(blobURL);

            this.connectToWorker();

            this.webWorker.postMessage({
                cmd: 'startRouter',
                data: {
                    tasks: tasks,
                    workers: workers,
                    day: day,
                    options: options
                }
            });

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
        var router = this;
        function onSolved () {

            if (router.amIDead()) return;

            var dir, order, originalTasks, skipFirst, skipLast, aux, sumTime = 0, currTask;

            if (worker.tasks.length) {
                dir = tsp.getGDirections();
                order = tsp.getOrder();
                originalTasks = worker.tasks.concat();
                skipFirst = !!worker.startPoint;
                skipLast = !(!worker.endPoint && worker.endPoint === null);

                worker.tasks = [];

                for (var i = skipFirst ? 1 : 0; i < (skipLast ? order.length - 1 : order.length); i++) {

                    currTask = originalTasks[order[i] - (skipFirst ? 1 : 0)];

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

                originalTasks = null;

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
            }

            console.groupEnd();

            router.deferred.notify('message', 'Calculada rota de ' + worker.name);

            callback();
        }

        if (this.amIDead()) return;

        console.group(worker.name);
        if (worker.tasks.length) {

            tsp.startOver();
            tsp.setTravelMode(google.maps.DirectionsTravelMode.DRIVING);

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

            if (worker.endPoint || worker.endPoint === null) {
                tsp.solveAtoZ(onSolved);
            } else {
                tsp.solveRoundTrip(onSolved);
            }

        } else {
            onSolved();
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

            tsp.setAvoidHighways(true);

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