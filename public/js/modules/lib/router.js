define(['../ext/strftime'], function(strftime){

    function Router (day, tasks, workers) {
        this.id = Math.random().toString(36).substr(2);
        this.deferred = $.Deferred();
        $.when(
                $.get(pager.build.moduleRoot + '/lib/router.worker.js')
                    .pipe(function(x){return x}),
                $.get(pager.build.moduleRoot + '/ext/crypto.sha1.min.js')
                    .pipe(function(x){return x;})
            ).done(function (worker, crypto) {

                var blob = new Blob([$('#script_lodash').text(), crypto, worker], {type: 'application/javascript'}),
                    blobURL = window.URL.createObjectURL(blob);

                this.webWorker = new Worker(blobURL);
                window.URL.revokeObjectURL(blobURL);

                this.connectToWorker();
                this.webWorker.postMessage({cmd: 'startRouter', data: {tasks: tasks, workers: workers, day: day}});

            }.bind(this));

        return this.deferred.promise();

    }

    Router.prototype.fetchTypes = function (usedTypes) {
        $.get(pager.urls.ajax + 'console/typeDuration', {types: usedTypes})
            .done(function (types) {
                this.webWorker.postMessage({cmd: 'parseTypes', data: types});
            }.bind(this));
    };

    Router.prototype.drawGraph = function (x) {
        console.log(x);
        var lines = x.lines,
            polygons = x.polygons;

        this.lines = this.lines || [];
        this.polygons = this.polygons || [];

        _.forEach(this.lines.concat(this.polygons), function (item) {
           item.setMap(null);
        });

        this.lines = [];
        this.polygons = [];

        _.forEach(lines, function (line) {

            if (line.points.length > 10) {
                console.log(line.points);
            }

            this.lines.push(
                new google.maps.Polyline({
                    map: pager.console.map,
                    strokeColor: line.color,
                    path: _.map(line.points, function (point) {
                        return new google.maps.LatLng(point.lat, point.lng);
                    })
                })
            );

        }, this);

        _.forEach(polygons, function (polygon) {

            this.polygons.push(
                new google.maps.Polygon({
                    map: pager.console.map,
                    fillColor: polygon.color,
                    strokeWeight: 0,
                    path: _.map(polygon.points, function (point) {
                        return new google.maps.LatLng(point.lat, point.lng);
                    })
                })
            );

        }, this);

    };

    Router.prototype.startTSP = function (workers) {
        var router = this, shouldCleanMap = true;
        require(['../ext/async', '../ext/BpTspSolver'], function (async, BpTspSolver) {

            var modal, tsp;

            modal = $('<div class="reveal-modal" data-reveal>')
                .append('<h2>Painel do Roteador</h2>')
                .attr('id', 'R-' + router.id)
                .appendTo('body');

            modal.foundation('reveal');
            //modal.foundation('reveal', 'open');

            tsp = new BpTspSolver(pager.console.map, modal[0]);




            function processWorker (worker, callback) {

                tsp.startOver();
                // Set your preferences
                //tsp.setAvoidHighways(true);
                tsp.setTravelMode(google.maps.DirectionsTravelMode.DRIVING);

                // Add points (by coordinates, or by address).
                // The first point added is the starting location.
                // The last point added is the final destination (in the case of A - Z mode)
                console.group(worker.name);
                tsp.addWaypoint(new google.maps.LatLng(worker.startingPoint.lat, worker.startingPoint.lng),
                    function () {
                        console.log('startingPoint', worker.startingPoint);
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

                    // Retrieve the solution (so you can display it to the user or do whatever :-)
                    var dir = tsp.getGDirections();  // This is a normal GDirections object.
                    // The order of the elements in dir now correspond to the optimal route.

                    // If you just want the permutation of the location indices that is the best route:
                    var order = tsp.getOrder(),
                        temp = worker.tasks.concat(),
                        skipFirst = !!worker.startingPoint,
                        skipLast = !(!worker.endPoint && worker.endPoint === null);

                    worker.tasks = [];

                    for (var i = skipFirst ? 1 : 0; i < (skipLast ? order.length - 1 : order.length); i++) {
                        worker.tasks.push(temp[
                            order[i] - (skipFirst ? 1 : 0)
                        ]);
                    }

                    temp = null;
                    // If you want the duration matrix that was used to compute the route:
                    var durations = tsp.getDurations();

                    console.log(order, durations);
                    console.groupEnd();

                    worker.drawDirections = function () {

                        if (shouldCleanMap) {
                            router.polygons.concat(router.lines).forEach(function (item) {
                                item.setMap(null);
                            });
                            shouldCleanMap = false;
                        }

                        worker.directions && worker.directions.setMap(null);
                        worker.directions = new google.maps.DirectionsRenderer({
                            directions: dir,
                            map: pager.console.map,
                            polylineOptions: {strokeColor: worker.color}/*,
                            suppressMarkers: true*/
                        });

                    };

                    worker.cleanDirections = function () {
                        worker.directions && worker.directions.setMap(null);
                        router.polygons.concat(router.lines).forEach(function (item) {
                            item.setMap(pager.console.map);
                        });
                        shouldCleanMap = true;
                    };

                    callback();
                }

                if (worker.endPoint || worker.endPoint === null) {
                    tsp.solveAtoZ(onSolved);
                } else {
                    tsp.solveRoundTrip(onSolved);
                }
            }
            async.eachSeries(workers, processWorker, function (err) {
                if (err) {
                    throw err;
                }
                console.log(workers);
            });
        });
    };

    Router.prototype.connectToWorker = function () {

        this.webWorker.addEventListener('message', function (e) {
            switch (e.data.type) {
                case 'progressLog':
                    console.log(e.data.data);
                    break;
                case 'assertion':
                    if (pager.isDev) {
                        console.assert(e.data.data[0], e.data.data[1] || 'Assertion failed');
                    }
                    break;
                case 'fetchTypes':
                    this.fetchTypes(e.data.data);
                    break;
                case 'drawGraph':
                    this.drawGraph(e.data.data);
                    break;
                case 'endOfTheLine':
                    this.startTSP(e.data.data);
                    break;
            }
        }.bind(this));

    };

    return Router;
});