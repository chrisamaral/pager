(function() {

    var tasks, workers, day,
        taskDurationByType, console,
        MINUTE = 1000 * 60,
        MAX_CLUSTER_DISTANCE = 5, //km
        MAX_TRAVEL_DISTANCE = 10,
        MAX_FIRST_HOP_DISTANCE = 100,
        TIME_SLOT_SIZE = MINUTE * 5, //minutes
        CAPACITY_THRESHOLD = MINUTE * 45,
        MAX_ERROR = MINUTE * 2; //minutes

    console = {
        log: function () {
            var args = arguments.length > 1 ? arguments : arguments[0];
            self.postMessage({type: 'progressLog', data: args});
        }
    };

    function roundNumber (number, digits) {
        var multiple = Math.pow(10, digits);
        var rndedNum = Math.round(number * multiple) / multiple;
        return rndedNum;
    }

    function fKM (x){
        if (x > 1) {
            return roundNumber(x, 2) + 'Km';
        } else {
            return roundNumber(x * 1000, 2) +"m";
        }
    }

    function assert (condition, message) {
        if (!condition) {
            self.postMessage({type: 'assertion', data: [condition, message]});
        }
    }

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
            d.setTime(d.getTime() + MINUTE * 60 * 24);
        }
        return d;
    }

    function recalcDistances (mode) {
        mode = mode || 'clusterization';
        _.forEach(tasks, function (task) {

            if (task.worker) {
                delete task.minDistance;
                return;
            }

            var closest = _.min(task.others, function (other) {

                if (!other.sharedWorkers.length) {
                    return undefined;
                }

                switch (mode) {
                    case 'clusterization':

                        if (other.task.cluster && (other.task.cluster === task.cluster || other.task.cluster.tasks.length > 3)) {
                            return undefined;
                        }

                        if (other.distance > MAX_CLUSTER_DISTANCE) {
                            return undefined;
                        }

                        break;

                    case 'distribution':

                        if (!other.task.worker) {
                            return undefined;
                        }

                        if (task.cluster && _.indexOf(task.cluster.candidateWorkers, other.task.worker) === -1){
                            return undefined;
                        }

                        if (_.indexOf(_.map(task.candidateWorkers, function(w){return w.worker;}), other.task.worker) === -1) {
                            return undefined;
                        }

                        if (other.task.cluster && other.task.cluster === task.cluster) {
                            return undefined;
                        }

                        if (other.distance > MAX_TRAVEL_DISTANCE) {
                            return undefined;
                        }

                        break;
                }

                return other.distance;
            });

            task.minDistance = closest === Infinity ? undefined : closest;
        });
    }

    function groupTasksByTarget(tasks) {
        var grouped = [];

        _.forEach(tasks, function (currentTask) {

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
        console.log(tasks.length + ' tasks grouped into ' + grouped.length);
        return grouped;
    }

    function isTodaySchedule(task) {
        var scheduleDay = task.schedule ? new Date(task.schedule.from) : null;
        return scheduleDay && toYMD(scheduleDay) === day;
    }

    function intervalIntersection (interval1, interval2) {
        var minB, maxA;

        if (!interval1 || !interval2) {
            return Infinity;
        }

        minB = Math.min(interval1.to.getTime(), interval2.to.getTime());
        maxA =  Math.max(interval1.from.getTime(), interval2.from.getTime());

        return minB - maxA;
    }

    function taskWorkers(task, skipOnExisting) {
        if (skipOnExisting && task.candidateWorkers) {
            return;
        }

        task.candidateWorkers = task.candidateWorkers || [];
        _.forEach(workers, function (worker) {
            var workerCantDo = _.difference(task.types, worker.types),
                intersection = intervalIntersection(task.schedule, worker.workShift);

            if (workerCantDo.length || intersection < task.duration) {
                return;
            }

            task.candidateWorkers.push({
                intersection: intersection,
                worker: worker
            });
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

        var shifts = [
                {from: '08:00', to: '17:00'},
                {from: '11:00', to: '20:00'},
                {from: '14:00', to: '23:00'}
            ], center = {lat: -22.904356, lng: -43.189390};

        //mock work shifts
        _.forEach(workers, function (currentWorker) {
            var aux;

            currentWorker.tasks = [];
            currentWorker.color = 'rgb(' + rndClr() + ', ' + rndClr() + ', ' + rndClr() + ')';

            currentWorker.startPoint = currentWorker.startPoint || center;


            if (!currentWorker.workShift) {
                aux = _.cloneDeep(shifts[Math.floor(Math.random() * shifts.length)]);
                currentWorker.workShift = aux;
            }

            currentWorker.workShift.from = toDt(currentWorker.workShift.from);
            currentWorker.workShift.to = toDt(currentWorker.workShift.to);


        });

        _.forEach(tasks, function (task) {
            var total = 0;

            task.others = task.others || {};

            taskSchedule(task);
            taskWorkers(task, true);

            _.forEach(tasks, function (otherTask) {

                if (otherTask.id === task.id) {
                    return;
                }

                taskSchedule(otherTask);
                taskWorkers(otherTask, true);

                var distance, workerIntersection, ftw = function(t){ return t.worker };

                distance = getDistanceFromLatLonInKm(
                    task.location.lat, task.location.lng,
                    otherTask.location.lat, otherTask.location.lng
                );

                workerIntersection = _.intersection(task.candidateWorkers.map(ftw), otherTask.candidateWorkers.map(ftw));

                if (workerIntersection.length) {

                    task.others[otherTask.id] = {
                        distance: distance,
                        task: otherTask,
                        sharedWorkers: workerIntersection
                    };

                    task.minDistance = pickMin(task.minDistance, task.others[otherTask.id]);
                    otherTask.minDistance = pickMin(otherTask.minDistance, task.others[otherTask.id]);
                    total += distance;
                }

            });

            var len = _.keys(task.others).length;
            task.averageDistance = len ? total / len : 0;

        });
    }

    function rndClr(){
        return _.random(30, 200);
    }

    function toH(d){
        return padZero(d.getHours()) + ':' + padZero(d.getMinutes());
    }

    function createTimeSlots () {
        var totalSlots, ini, end, d = new Date(), aux;
        _.forEach(workers, function (worker) {
            ini = worker.workShift.from.getTime();
            end = worker.workShift.to.getTime(),
            totalSlots = Math.floor((end - ini)/TIME_SLOT_SIZE);
            worker.capacity = end - ini;
            worker.used = 0;
            worker.timeSlots = [];

            for (var i = 0; i < totalSlots; i++) {

                d.setTime(ini + i * TIME_SLOT_SIZE);
                aux = {from: toH(d), vAlloc: 0};

                d.setTime(d.getTime() + TIME_SLOT_SIZE);
                aux.to = toH(d);

                worker.timeSlots.push(aux);
            }
        });
    }

    function calculateTaskInterval (taskSchedule, workerShift) {
        taskSchedule = taskSchedule || workerShift;
        return {
            from: Math.max(taskSchedule.from.getTime(), workerShift.from.getTime()),
            to: Math.min(taskSchedule.to.getTime(), workerShift.to.getTime())
        };
    }

    function fillTimeSlots(worker, tasks) {
        var newWorkerTasks = (worker.tasks || []).concat(tasks),
            newWorkerUsed = worker.used,
            newWorkerTimeSlots = _.map(worker.timeSlots, function(x){ return _.cloneDeep(x); });

        _.forEach(tasks, function (task) {

            var taskInterval = calculateTaskInterval(task.schedule, worker.workShift),
                firstSlot = Math.floor((taskInterval.from - worker.workShift.from.getTime()) / TIME_SLOT_SIZE),
                totalSlots = Math.floor((taskInterval.to - taskInterval.from) / TIME_SLOT_SIZE),
                lastSlot = firstSlot + totalSlots,
                taskSlots = Math.floor(task.duration / TIME_SLOT_SIZE),
                i, j;

            assert(totalSlots >= taskSlots, totalSlots + ' < ' + taskSlots);

            newWorkerUsed += task.duration;

            for (i = firstSlot; i < lastSlot; i++) {
                newWorkerTimeSlots[i].vAlloc += 1 / (totalSlots - taskSlots + 1);

                if (i + taskSlots > lastSlot) {
                    continue;
                }

                for (j = i + 1; j < i + taskSlots && j < lastSlot; j++) {
                    newWorkerTimeSlots[j].vAlloc += 1 / (totalSlots - taskSlots + 1);
                }
            }
        });

        if (_.any(newWorkerTimeSlots, function (t) {return t.vAlloc > 1;})) {
            return false;
        }

        worker.timeSlots = newWorkerTimeSlots;
        worker.tasks = newWorkerTasks;
        worker.used = newWorkerUsed;
        _.forEach(tasks, function(task){ task.worker = worker; task.cluster && delete task.cluster; });

        return true;
    }
    function taskFits(worker, task){
        return worker.capacity - (task.duration + worker.used) >= Math.min(worker.capacity * 0.3, CAPACITY_THRESHOLD);
    }
    function mergeClusters (thisCluster, bestMatch, clusters) {
        var mergedCluster = bestMatch.cluster, index;

        _.forEach(mergedCluster.tasks, function(task){
            task.cluster = thisCluster;
        });

        thisCluster.perimeter += mergedCluster.perimeter;
        thisCluster.tasks = thisCluster.tasks.concat(mergedCluster.tasks);

        index = _.findIndex(clusters, function (cluster) {
            return cluster === mergedCluster;
        });

        clusters.splice(index, 1);
    }

    function allocIterator (clusters) {

        function hasClosestWorker () {
            var min = _.min(tasks, function (task) {

                delete task.closestWorker;

                if (task.worker) {
                    return undefined;
                }

                var min = _.min(task.candidateWorkers, function (worker) {
                    var theWorker = worker.worker;


                    if (task.cluster && _.indexOf(task.cluster.candidateWorkers, theWorker) === -1) {
                        return undefined;
                    }

                    /*
                    if (theWorker.tasks.length > 0) {
                        return undefined;
                    }
                    */

                    worker.distance = getDistanceFromLatLonInKm(
                        task.location.lat, task.location.lng,
                        theWorker.startPoint.lat, theWorker.startPoint.lng
                    );

                    if (worker.distance > MAX_FIRST_HOP_DISTANCE) {
                        return undefined;
                    }

                    return worker.distance;
                });


                if (min !== Infinity) {
                    task.closestWorker = min.worker;
                }

                return min !== Infinity ? min.distance : undefined;
            });

            return min !== Infinity ? min : null;
        }

        function hasClosestTask () {
            var min = _.min(tasks, function (task) {

                if (!task.minDistance) {
                    return undefined;
                }

                if (task.worker) {
                    return undefined;
                }

                if (task.minDistance.distance > MAX_TRAVEL_DISTANCE) {
                    return undefined;
                }

                return task.minDistance.distance;
            });
            return min !== Infinity ? min : null;
        }

        var closeToSomeOne, closeToSomeWorker, thisCluster, thisWorker, thisTask, index;

        do {

            closeToSomeWorker = null; closeToSomeOne = null; thisCluster = null;

            recalcDistances('distribution');
            (closeToSomeWorker = hasClosestWorker()) || (closeToSomeOne = hasClosestTask());

            if (!closeToSomeOne && !closeToSomeWorker) continue;

            if (closeToSomeOne) {
                thisWorker = closeToSomeOne.minDistance.task.worker;
                /*console.log(closeToSomeOne.address.address + ' < ' +
                    fKM(closeToSomeOne.minDistance.distance) + ' > ' + closeToSomeOne.minDistance.task.address.address);*/
            } else {
                thisWorker = closeToSomeWorker.closestWorker;
            }

            thisTask = closeToSomeOne || closeToSomeWorker;

            if (thisTask.cluster) {

                thisCluster = thisTask.cluster;

                if (!taskFits(thisWorker, thisCluster) || !fillTimeSlots(thisWorker, thisCluster.tasks)) {
                    index = _.findIndex(thisTask.candidateWorkers, {worker: thisWorker});
                    if (index >= 0) {
                        thisTask.candidateWorkers.splice(index, 1);
                    }

                } else {
                    _.pull(clusters, thisCluster);
                }

            } else {

                if (!taskFits(thisWorker, thisTask) || !fillTimeSlots(thisWorker, [thisTask])) {
                    index = _.findIndex(thisTask.candidateWorkers, {worker: thisWorker});
                    if (index >= 0) {
                        thisTask.candidateWorkers.splice(index, 1);
                    }
                }
            }


        } while (closeToSomeOne || closeToSomeWorker);

        _.forEach(tasks, function(task){

            task.cluster && delete task.cluster;
            task.minDistance && delete task.minDistance;
            task.others && delete task.others;
            task.candidateWorkers && delete task.candidateWorkers;
            task.worker && delete task.worker;

            delete task.averageDistance;
        });

        self.postMessage({type: 'endOfTheLine', data: _.filter(workers, function (w) {
            return w.tasks.length;
        })});

        self.close();
    }

    function firstAlloc (clusters) {
        clusters = clusters || [];
        var oldClusters;
        createTimeSlots();

        _.forEach(clusters, function (cluster) {
            cluster.duration = _.reduce(cluster.tasks, function(sum, task){
                return _.isNumber(sum)
                        ? sum + task.duration
                        : sum.duration + task.duration;
            });

            cluster.candidateWorkers = _.intersection.apply(_,
                _.map(cluster.tasks, function (task) {
                    return task.candidateWorkers.map(function (x) {
                        return x.worker;
                    });
                }));

            var theWorker = _.min(cluster.candidateWorkers, function (w) {
                return w.used / w.capacity;
            });

            if (theWorker
                    && taskFits(theWorker, cluster)
                    && fillTimeSlots(theWorker, cluster.tasks)
            ) {

                cluster.worker = theWorker;
            }
        });
        oldClusters = clusters;

        clusters = _.filter(clusters, function(c){ return c.worker === undefined; });

        oldClusters.length !== clusters.length && console.log(oldClusters.length + ' clusters reduced to ' + clusters.length);

        allocIterator(clusters);
    }

    function makeClusters () {

        function findstartPoint () {
            var min = _.min(tasks, function (task) {
                if (task.cluster && task.cluster.tasks.length > 3 || !task.minDistance) {
                    return undefined;
                }
                return task.minDistance.distance;
            });
            return min !== Infinity ? min : null;
        }

        var clusters = [], hasBestMatch, thisCluster, bestMatch;

        do {

            recalcDistances();
            hasBestMatch = findstartPoint();

            if (!hasBestMatch) continue;

            if (!hasBestMatch.cluster) {

                thisCluster = {
                    perimeter: 0,
                    tasks: [hasBestMatch],
                    color: 'rgb(' + rndClr() + ', ' + rndClr() + ', ' + rndClr() + ')'
                };

                hasBestMatch.cluster = thisCluster;
                clusters.push(thisCluster);

            } else {
                thisCluster = hasBestMatch.cluster;
            }

            thisCluster.perimeter += hasBestMatch.minDistance.distance;

            bestMatch = hasBestMatch.minDistance.task;

            if (!bestMatch.cluster) {

                bestMatch.cluster = thisCluster;
                thisCluster.tasks.push(bestMatch);

            } else mergeClusters(thisCluster, bestMatch, clusters);

        } while (hasBestMatch);

        firstAlloc(clusters);
    }

    function initialize (data) {
        console.log('Iniciando roteador...');
        console.log(data.day);
        console.log('Processando argumentos...');

        tasks = groupTasksByTarget(data.tasks);

        if (tasks.length === 0) return self.close();

        workers = data.workers;
        day = data.day;

        console.log('Calculando duração de atividades...');

        self.postMessage({
            type: 'fetchTypes',
            data: _.uniq(
                _.flatten(
                    _.map(tasks,
                        function (t) {
                            return t.types;
                        }
                    )
                )
            )
        });
        //prepareArgs();
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
                    task.duration = _.max(durations) * MINUTE;
                });
                console.log('Iniciando cálculos...');

                prepareArgs();
                //makeClusters();
                firstAlloc()

                break;
        }
    });
}());