/** @jsx React.DOM */
define(['./../lib/component.DateInput.js', './console.queue', './console.tasks', '../ext/strftime'],
function (DateInput, Queue, Tasks, strftime) {

    var Aviator = pager.Aviator;

    var RouterWorker = React.createClass({displayName: 'RouterWorker',
        drawMe: function () {
            if (!this.props.worker.tasks.length) return;
            this.props.drawWorkerDirections(this.props.worker._id);
        },
        render: function () {
            return React.DOM.li( {key:this.props.worker._id}, 
                React.DOM.a( {onClick:this.drawMe}, this.props.worker.name)
            )
        }
    });

    var RouterWorkers = React.createClass({displayName: 'RouterWorkers',
        drawWorkerDirections: function (id) {

            this.props.workers.forEach(function (worker) {

                if (!worker.tasks.length) return;

                if (!(worker._id === id && worker.drawDirections())) {

                    worker._id !== id && worker.cleanDirections();
                    worker._id === id && this.props.toggleRouterMode(null);
                    return;

                }

                this.props.toggleRouterMode(
                    worker._id, worker.tasks.map(
                        function (task) {

                            if (!task.schedule) return;

                            var attrs = [
                                {relevance: 3, value: worker.name},
                                {descr: 'Tipos', value: _.uniq(task.types).join(', ')},
                                {
                                    descr: 'Deslocamento',
                                    value: strftime('%H:%M', task.directions.schedule.ini) + ' < ' +
                                        task.directions.duration.text + ' - ' + task.directions.distance.text +
                                        ' > ' + strftime('%H:%M', task.directions.schedule.end)
                                },
                                {
                                    descr: 'Execução',
                                    value: strftime('%H:%M', task.schedule.ini) + ' < ' +
                                        Math.floor(task.duration/1000/60) + 'min' + ' > ' +
                                        strftime('%H:%M', task.schedule.end)
                                },
                                {descr: 'Duração', value: Math.floor(task.duration/1000/60) + 'min'}
                            ], ids = _.map(task.tasks, '_id');

                            if (task.schedule.from && task.schedule.to) {
                                !_.isDate(task.schedule.from) && (task.schedule.from = new Date(task.schedule.from));
                                !_.isDate(task.schedule.to) && (task.schedule.to = new Date(task.schedule.to));

                                attrs.push({descr: 'Agenda', value: strftime('%d/%m/%Y', task.schedule.from)});

                                attrs.push({
                                    descr: 'Turno',
                                    value: strftime('%H:%M', task.schedule.from)
                                        + ' <> ' + strftime('%H:%M', task.schedule.to)
                                });
                            }

                            ids.length && attrs.push({descr: 'ID', value: ids.join(', ')});

                            if (task.target) {
                                attrs.push({descr: 'Cliente', value: task.target.name, relevance: 2});
                            }

                            attrs.push({value: task.address.address});

                            return {
                                id: 'wRTask-' + task.id,
                                worker: worker.name,
                                location: task.location,
                                attrs: attrs
                            };
                        }
                    )
                );
            }.bind(this));
        },

        render: function () {
            return React.DOM.div( {id:"RouterWorkers"}, 
                React.DOM.ul(null, 
                    this.props.workers.map(function (worker) {
                        return RouterWorker( {drawWorkerDirections:this.drawWorkerDirections, key:worker._id, worker:worker} );
                    }.bind(this))
                )
            );
        }
    });

    var RouterController = React.createClass({displayName: 'RouterController',
        getInitialState: function () {
            return {
                messages: [],
                workers: [],
                day: this.props.router._day
            };
        },

        componentDidMount: function() {

            this.props.router.progress(function (type, data) {
                if (!this.isMounted()) return;

                switch (type) {
                    case 'message':
                        this.state.messages.push(data);
                        this.setState({messages: this.state.messages});
                        break;
                }
            }.bind(this));

            this.props.router.done(function (workers) {
                if (!this.isMounted()) return;

                this.setState({workers: workers});
            }.bind(this));

            this.props.router.fail(function () {
                if (!this.isMounted()) return;

                this.props.cancelRoute();
            }.bind(this));

        },
        cancel: function () {
            this.state.workers.forEach(function (worker) {
                if (worker.cleanDirections) worker.cleanDirections();
            });
            this.props.cancelRoute();
        },
        save: function () {
            this.state.workers.forEach(function (worker) {
                if (worker.cleanDirections) worker.cleanDirections();
            });
            this.props.saveRoute(this.state.workers, this.state.day);
        },
        render: function () {
            return React.DOM.div( {id:"Router", className:"leftMapControl"}, 
                React.DOM.div( {className:"controlIco"}, React.DOM.i( {className:"fi-page-multiple"})),
                React.DOM.div( {className:"controlContent"}, 
                    React.DOM.h4(null, "Roteador"),
                    React.DOM.div( {className:"panel contained clearfix"}, 

                         !this.state.workers.length &&
                            React.DOM.div( {id:"RouterLog"}, 
                                this.state.messages.map(function (msg, index) {
                                    return React.DOM.p( {key:index}, msg);
                                })
                            ),
                            

                        RouterWorkers( {workers:this.state.workers, toggleRouterMode:this.props.toggleRouterMode} ),

                        React.DOM.div( {className:"row"}, 
                            React.DOM.div( {className:"small-12 columns text-right"}, 
                                React.DOM.button( {onClick:this.cancel, className:"tiny alert button"}, "Cancelar"),
                                this.state.workers && this.state.workers.length
                                    ? React.DOM.button( {onClick:this.save, className:"tiny success button"}, "Salvar")
                                    : null
                            )
                        )

                    )
                )
            );
        }
    });

    var ConsoleOpts = React.createClass({displayName: 'ConsoleOpts',
        handleSubmit: function (e) {
            e.preventDefault();

            var s = {day: this.refs.dayInput.getDOMNode().value,
                org: pager.org.id, locations: this.props.locations};

            Aviator.navigate('/:org/console/:day/:locations', {namedParams: s});
        },
        render: function () {
            return (
                React.DOM.div( {id:"ConsoleOpts", className:"leftMapControl"}, 
                    React.DOM.div( {className:"controlIco"}, 
                        React.DOM.i( {className:"fi-widget"})
                    ),
                    React.DOM.div( {className:"controlContent"}, 
                        React.DOM.h4(null, "Opções da agenda"),
                        React.DOM.div( {className:"panel contained"}, 
                            React.DOM.form( {onSubmit:this.handleSubmit}, 
                                React.DOM.div( {className:"row"}, 
                                    React.DOM.div( {className:"large-12 columns"}, 
                                        React.DOM.label(null, "Dia",
                                            DateInput( {ref:"dayInput", date:this.props.day, inputName:"day"} )
                                        )
                                    )
                                ),
                                React.DOM.div( {className:"row"}, 
                                    React.DOM.div( {className:"large-12 columns text-right"}, 
                                        React.DOM.button( {className:"tiny success button"}, "Ok")
                                    )
                                )
                            )
                        )
                    )
                )
                );
        }
    });

    var LeftPanel = React.createClass({displayName: 'LeftPanel',
        componentDidMount: function () {
            function toggleControl () {
                $(this).closest('.leftMapControl').children('.controlContent,.controlIco').toggle();
                $('#Console').trigger('resize');
            }
            $(this.getDOMNode()).on('click', '.controlContent>h4,.controlIco', toggleControl);
        },
        render: function () {
            return React.DOM.nav( {id:"LeftPanel"}, 
                React.DOM.div( {id:"LeftPanelWrapper"}, 
                     this.props.pending.length
                        ? Queue( {items:this.props.pending,
                                locations:this.props.locations} )
                        : null,
                    

                    ConsoleOpts( {day:this.props.day, locations:this.props.locations} ),

                     this.props.router
                        ? RouterController( {router:this.props.router,
                            saveRoute:this.props.saveRoute,
                            cancelRoute:this.props.cancelRoute,
                            toggleRouterMode:this.props.toggleRouterMode} )
                        : null,
                    
                    Tasks( {routeTasks:this.props.routeTasks,
                            locations:this.props.locations,
                            day:this.props.day,
                            setTaskFocus:this.props.setTaskFocus,
                            selectedTask:this.props.selectedTask,
                            hasGoogleMaps:this.props.hasGoogleMaps,
                            queries:this.props.queries,
                            setQueries:this.props.setQueries} )
                )
            );
        }
    });
    return LeftPanel;
});