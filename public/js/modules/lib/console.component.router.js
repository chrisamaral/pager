define(function(){
    return {
        toggleRouterMode: function (worker, tasks) {
            var st = {};
            if (!worker) {
                st.mapState = pager.constant.console.map.AVAILABLE_TASKS;
                st.routerWorker = null;
            } else {
                st.mapState = pager.constant.console.map.ROUTER_PROJECTION;
                st.routerWorker = {wayPoints: tasks};
            }

            this.setState(st);
        },

        killRoute: function () {
            var new_st = {};
            if (this.state.mapState === pager.constant.console.map.ROUTER_PROJECTION) {
                new_st.mapState = pager.constant.console.map.AVAILABLE_TASKS;
                new_st.routerWorker = null;
            }

            this.state.router.stopRouter();
            new_st.router = null;

            this.setState(new_st);
        },

        saveRoute: function (workers, day) {

            function mountTask (task) {

                var new_t = {
                    fakeID: task.fakeID,
                    address: task.address,
                    location: task.location,
                    directions: task.directions,
                    duration: task.duration,
                    schedule: task.schedule,
                    work_orders: _.map(task.tasks, function (t) {
                        return {
                            _id: t._id,
                            attrs: t.attrs,
                            type: t.type
                        };
                    })
                };

                if (task.ref && task.target) {
                    new_t.ref = task.ref;
                    new_t.target = task.target;
                }

                return new_t;
            }

            function mountWorker (worker) {

                var new_w = {
                    worker: {
                        _id: worker._id,
                        name: worker.name,
                        workShift: worker.workShift
                    },
                    tasks: _.map(worker.tasks, mountTask)
                };


                new_w.work_orders = _.uniq(
                    _.flatten(
                        _.map(new_w.tasks, function (w) {
                            return _.map(w.work_orders, '_id');
                        })
                    )
                );

                _.forEach(new_w.tasks, function (t) {
                    if (t.target) {
                        if (!new_w[t.ref + 's']) new_w[t.ref + 's'] = [];
                        new_w[t.ref + 's'].push(t.target._id);
                    }
                });

                if (worker.startPoint) new_w.startPoint = worker.startPoint;
                if (worker.endPoint) new_w.endPoint = worker.endPoint;

                return new_w;
            }

            var ws = _.map(workers, mountWorker);

            $.ajax({
                type: 'POST',
                url: pager.urls.ajax + 'console/schedule/' + day,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ws)
            }).always(function () {

                this.updateSchedule();
                this.syncQueries();

            }.bind(this));

            this.killRoute();
        },

        cancelRoute: function () {
            this.killRoute();
        },
        startRouter: function (tasks) {
            var Console = this,
                day = this.state.day;

            if (this.state.router) return;

            if (!Modernizr.webworkers) {
                return alert('Este navegador não suporta as tecnologias necessárias para utilização do roteador. '+
                    'Por favor, atualize seu browser e tente novamente.');
            }

            require(['../lib/router', './console.router.cfg'], function (Router, RCfg) {
                var new_state = {};

                pager.components.RouterCfg = RCfg;

                if (!Console.isMounted()) return;

                new_state.routerLoader = function (workers, options) {

                    var latest_state = {routerLoader: null};

                    if (Console.isMounted() && workers && workers.length) {
                        latest_state.router = new Router(day, tasks, workers, options);
                        latest_state.router._day = day;
                    }

                    Console.setState(latest_state);
                };

                new_state.routerLoader._day = day;
                Console.setState(new_state);
            });
        },
        initRouter: function (tasks) {
            this.startRouter(tasks);
        }
    };
});