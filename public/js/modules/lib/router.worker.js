(function() {

    var tasks, workers, day, dDay,
        taskDurationByType, console, MAX_CLUSTER_DISTANCE = 5;

    console = {
        log: function () {
            var args = arguments.length > 1 ? arguments : arguments[0];
            self.postMessage({type: 'progressLog', data: args});
        }
    };

    function deg2rad(deg) {
        return deg * (Math.PI/180)
    }

    function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
        var R = 6371; // Radius of the earth in km
        var dLat = deg2rad(lat2-lat1);  // deg2rad below
        var dLon = deg2rad(lon2-lon1);
        var a =
                Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
                Math.sin(dLon/2) * Math.sin(dLon/2)
            ;
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c; // Distance in km
        return d;
    }
    function padZero (str) {
        str = _.isString(str) ? str : '' + str;
        return str.length >= 2 ? str : '0' + str;
    }
    function toYMD (d) {
        return d.getFullYear() + '-' + padZero(d.getMonth() + 1) + '-' + padZero(d.getDate());
    }

    function fromYMD (str) {
        var d = new Date(str);
        if (toYMD(d).replace(/\D/g,'') !== str.replace(/\D/g,'')) {
            d.setHours(0,0,0,0);
            d.setTime(d.getTime() + 1000 * 60 * 60 * 24);
        }
        return d;
    }

    function groupTasksByTarget(tasks) {
        var grouped = [];

        tasks.forEach(function (currentTask) {

            if (!currentTask.location) {
                return;
            }

            var inCollection,
                newTask,
                itIsAMe = function (me) {
                    return me.sys_id === currentTask.sys_id || me._id === currentTask._id;
                },
                id = '' + CryptoJS.SHA1((currentTask.target ? currentTask.target.sys_id : '') + currentTask.address.address.toLowerCase()),
                inCollection = _.find(grouped, {id: id});

            if (!inCollection) {

                newTask = {
                    id: id,
                    ref: currentTask.ref,
                    address: currentTask.address,
                    target: currentTask.target,
                    types: [currentTask.type],
                    tasks: [currentTask]
                };

                if (currentTask.schedule) {
                    newTask.schedule = currentTask.schedule;
                }

                if (currentTask.location) {
                    newTask.location = currentTask.location;
                }

                grouped.push(newTask);

            } else {

                if (_.any(inCollection.tasks, itIsAMe)) {
                    return;
                }

                inCollection.tasks.push(currentTask);
                inCollection.types.push(currentTask.type);

                if (currentTask.schedule) {
                    inCollection.schedule = inCollection.schedule || currentTask.schedule;

                    inCollection.schedule.from = inCollection.schedule.from < currentTask.schedule.from
                        ? inCollection.schedule.from
                        : currentTask.schedule.from;

                    inCollection.schedule.to = inCollection.schedule.to < currentTask.schedule.to
                        ? inCollection.schedule.to
                        : currentTask.schedule.to;
                }
            }
        });

        return grouped;
    }

    function isTodaySchedule(task) {
        var scheduleDay = task.schedule ? new Date(task.schedule.from) : null;
        return scheduleDay && toYMD(scheduleDay) === day;
    }

    function taskWorkers(task, skipOnExisting) {
        if (skipOnExisting && task.candidateWorkers) {
            return;
        }

        task.candidateWorkers = task.candidateWorkers || [];
        workers.forEach(function (worker) {
            var workerCantDo = _.difference(task.types, worker.types),
                intersection = intervalIntersection(task.schedule, worker.workShift) / (1000 * 60);

            if (workerCantDo.length || intersection < task.duration) {
                return;
            }

            task.candidateWorkers.push(worker);
        });
    }

    function pickMin(currentValue, newValue) {

        if (newValue.distance > MAX_CLUSTER_DISTANCE) {
            return currentValue;
        }

        if (currentValue === null || currentValue === undefined) {
            return newValue;
        }

        if (currentValue.distance < newValue.distance) {
            return newValue;
        }

        return currentValue;
    }

    function intervalIntersection (interval1, interval2) {
        var minB, maxA;

        if (!interval1 || !interval2) {
            return Infinity;
        }

        minB = Math.min((new Date(interval1.to)).getTime(), (new Date(interval2.to)).getTime());
        maxA =  Math.max((new Date(interval1.from)).getTime(), (new Date(interval2.from)).getTime());

        return minB - maxA;
    }
    function taskSchedule (task) {
        if (!isTodaySchedule(task)) {
            delete task.schedule;
        } else {

            task.schedule.from = new Date(task.schedule.from);
            task.schedule.from.setSeconds(0, 0);

            task.schedule.to = new Date(task.schedule.to);
            task.schedule.to.setSeconds(0, 0);

        }
    }
    function toDt(h){
        var aux, x;
        aux = h.split(':');
        x = fromYMD(day);
        x.setHours(parseInt(aux[0], 10), parseInt(aux[1], 10), 0, 0);
        return x;
    }
    function prepareArgs () {

        var usedTypes = [],
            shifts = [
                {from: '08:00', to: '17:00'},
                {from: '11:00', to: '20:00'},
                {from: '14:00', to: '23:00'}
            ];

        //mock work shifts
        workers.forEach(function (currentWorker) {
            var aux = _.cloneDeep(shifts[Math.floor(Math.random() * shifts.length)]);
            currentWorker.workShift = aux;

            currentWorker.workShift.from = toDt(aux.from);
            currentWorker.workShift.to = toDt(aux.to);
        });

        _.forEach(tasks, function (task) {
            var total = 0;

            usedTypes = _.union(task.types, usedTypes);
            task.others = task.others || {};

            taskSchedule(task);
            taskWorkers(task, true);

            _.forEach(tasks, function (otherTask) {

                if (otherTask.id === task.id) {
                    return;
                }

                taskSchedule(otherTask);
                taskWorkers(otherTask, true);

                var distance, workerIntersection;

                distance = getDistanceFromLatLonInKm(
                    task.location.lat, task.location.lng,
                    otherTask.location.lat, otherTask.location.lng
                );

                workerIntersection = _.intersection(task.candidateWorkers, otherTask.candidateWorkers);

                task.others[otherTask.id] = {
                    distance: distance,
                    task: otherTask,
                    sameWorkers: workerIntersection
                };

                if (workerIntersection.length) {
                    task.minDistance = pickMin(task.minDistance, task.others[otherTask.id]);
                    otherTask.minDistance = pickMin(otherTask.minDistance, task.others[otherTask.id]);
                }

                total += distance;
            });

            var len = _.keys(task.others).length;
            task.averageDistance = len ? total / len : 0;

        });

        console.log('Calculando duração de atividades...');
        self.postMessage({type: 'fetchTypes', data: usedTypes});

    }

    function findStartingPoint () {
        var min = _.min(tasks, function (task) {
            if (task.cluster && task.cluster.tasks.length > 2 || !task.minDistance) {
                return undefined;
            }
            return task.minDistance.distance;
        });
        return min !== Infinity ? min : null;
    }

    function recalcDistances () {
        _.forEach(tasks, function (task) {

            var closest = _.min(task.others, function (other) {
                if (!other.sameWorkers.length) {
                    return undefined;
                }
                if (other.task.cluster && (other.task.cluster === task.cluster || other.task.cluster.tasks.length > 2)) {
                    return undefined;
                }
                if (other.distance > MAX_CLUSTER_DISTANCE) {
                    return undefined;
                }
                return other.distance;
            });

            task.minDistance = closest === Infinity ? undefined : closest;
        });
    }

    function addrAbbr (components) {
        var vals = [];

        _.forEach(components, function(component){
            if (component.name === 'neighbourhood' || component.name === 'city') {
                vals.push(component.value);
            }
        });
        return vals.join(', ');
    }

    function rndClr(){
        return Math.floor(Math.random() * 200);
    }

    function clusterGraph (clusters) {
        var minX = Infinity, maxY = -Infinity, graph = {nodes: [], edges: []};

        _.forEach(tasks, function (task) {
            minX = Math.min(task.location.lng, minX);
            maxY = Math.max(task.location.lat, maxY);
        });

        _.forEach(tasks, function (task) {
            graph.nodes.push({
                id: task.id,
                label: task.address.address +
                    (task.schedule ? ' ' + task.schedule.from.getHours() + ' <> ' + task.schedule.to.getHours() : ''),//addrAbbr(task.address.components),
                size: 0,//task.tasks.length,
                x: getDistanceFromLatLonInKm(0, minX, 0, task.location.lng),
                y: getDistanceFromLatLonInKm(maxY, 0, task.location.lat, 0),
                color: task.cluster ? task.cluster.color : 'rgb(30,30,30)'
            });
        });

        _.forEach(clusters, function (cluster){
            for (var i = 0; i < cluster.edges.length - 1; i = i + 2) {
                graph.edges.push({
                    id: 'e' + graph.edges.length,
                    source:  cluster.edges[i].id,
                    target: cluster.edges[i+1].id
                });
            }
        });
        console.log(clusters);
        self.postMessage({type: 'drawGraph', data: graph});

    }
    function makeClusters () {
        var clusters = [], hasBestMatch, thisCluster, bestMatch, mergedCluster, index;

        hasBestMatch = findStartingPoint();

        while (hasBestMatch) {

            if (!hasBestMatch.cluster) {

                thisCluster = {
                    perimeter: 0,
                    tasks: [hasBestMatch],
                    edges: [],
                    color: 'rgb(' + rndClr() + ', ' + rndClr() + ', ' + rndClr() + ')'
                };

                hasBestMatch.cluster = thisCluster;
                clusters.push(thisCluster);

            } else {
                thisCluster = hasBestMatch.cluster;
            }

            thisCluster.edges.push(hasBestMatch);
            thisCluster.perimeter += hasBestMatch.minDistance.distance;
            bestMatch = hasBestMatch.minDistance.task;

            if (!bestMatch.cluster) {

                bestMatch.cluster = thisCluster;
                thisCluster.tasks.push(bestMatch);
                thisCluster.edges.push(bestMatch);

            } else {

                mergedCluster = bestMatch.cluster;
                _.forEach(mergedCluster.tasks, function(task){
                    task.cluster = thisCluster;
                });

                thisCluster.edges.push(bestMatch);
                thisCluster.perimeter += mergedCluster.perimeter;

                thisCluster.edges = thisCluster.edges.concat(mergedCluster.edges);
                thisCluster.tasks = thisCluster.tasks.concat(mergedCluster.tasks);

                index = _.findIndex(clusters, function (cluster) {
                    return cluster === mergedCluster;
                });

                clusters.splice(index, 1);
            }

            //recalc minDistance
            recalcDistances();
            hasBestMatch = findStartingPoint();
        }

        clusterGraph(clusters);
    }

    function initialize (data) {
        console.log('Iniciando roteador...');
        console.log(data.day);
        console.log('Processando argumentos...');

        tasks = groupTasksByTarget(data.tasks);
        workers = data.workers;
        day = data.day;

        prepareArgs();
    }

    self.addEventListener('message', function (e) {
        switch (e.data.cmd) {
            case 'startRouter':
                initialize(e.data.data);
                break;
            case 'parseTypes':
                taskDurationByType = e.data.data;
                _.forEach(tasks, function (task) {
                    var durations = [];
                    _.forEach(task.types, function (type) {
                        if (taskDurationByType[type]) {
                            durations.push(taskDurationByType[type]);
                        }
                    });
                    task.duration = _.max(durations);
                });
                console.log('Iniciando cálculos...');
                makeClusters();
                break;
        }
    });
}());