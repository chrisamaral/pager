/** @jsx React.DOM */
define(['./../lib/component.DateInput.js', './console.queue', './console.tasks', '../ext/strftime'],
function (DateInput, Queue, Tasks, strftime) {

    var Aviator = pager.Aviator;

    var RouterWorker = React.createClass({
        drawMe: function () {
            if (!this.props.worker.tasks.length) return;
            this.props.drawWorkerDirections(this.props.worker._id);
        },
        render: function () {
            return <tr>
                <td>{this.props.worker.name}</td>
                <td>{this.props.worker.tasks ? this.props.worker.tasks.length : '0'}</td>
                <td>{this.props.worker.tasks && this.props.worker.tasks.length
                        ? <a className='radius ico fi-map' onClick={this.drawMe}></a>
                        : null
                }</td>
            </tr>
        }
    });

    var RouterWorkers = React.createClass({
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
            return <div id='RouterWorkers'>
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Visitas</th>
                            <th>{'##'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this.props.workers.map(function (worker) {
                            return <RouterWorker drawWorkerDirections={this.drawWorkerDirections} key={worker._id} worker={worker} />;
                        }.bind(this))}
                    </tbody>
                </table>
            </div>;
        }
    });

    var RouterController = React.createClass({
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
            return <div id='Router' className='leftMapControl'>
                <div className='controlIco'><i className='fi-page-multiple'></i></div>
                <div className='controlContent'>
                    <h3 className='controlTitle'>Roteador</h3>
                    <div className='panel contained clearfix'>

                        { !this.state.workers.length &&
                            <div id='RouterLog'>
                                {this.state.messages.map(function (msg, index) {
                                    return <p key={index}>{msg}</p>;
                                })}
                            </div>
                            }

                        <RouterWorkers workers={this.state.workers} toggleRouterMode={this.props.toggleRouterMode} />

                        <div className='row'>
                            <div className='medium-12 columns text-right'>
                                <button onClick={this.cancel} className='tiny alert button'>Cancelar</button>
                                {this.state.workers && this.state.workers.length
                                    ? <button onClick={this.save} className='tiny success button'>Salvar</button>
                                    : null}
                            </div>
                        </div>

                    </div>
                </div>
            </div>;
        }
    });

    var ConsoleOpts = React.createClass({
        handleSubmit: function (e) {
            e.preventDefault();

            var s = {day: this.refs.dayInput.getDOMNode().value,
                org: pager.org.id, locations: this.props.locations};

            Aviator.navigate('/:org/console/:day/:locations', {namedParams: s});
        },
        render: function () {
            return (
                <div id='ConsoleOpts' className='leftMapControl'>
                    <div className='controlIco'>
                        <i className='fi-widget'></i>
                    </div>
                    <div className='controlContent'>
                        <h3 className='controlTitle'>Opções da agenda</h3>
                        <div className='panel contained'>
                            <form onSubmit={this.handleSubmit}>
                                <div className='row'>
                                    <div className='large-12 columns'>
                                        <label>Dia
                                            <DateInput ref='dayInput' date={this.props.day} inputName='day' />
                                        </label>
                                    </div>
                                </div>
                                <div className='row'>
                                    <div className='large-12 columns text-right'>
                                        <button className='tiny success button'>Ok</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                );
        }
    });

    var LeftPanel = React.createClass({
        componentDidMount: function () {
            function toggleControl () {
                $(this).closest('.leftMapControl').children('.controlContent,.controlIco').toggle();
                $('#Console').trigger('resize');
            }
            $(this.getDOMNode()).on('click', '.controlContent>.controlTitle,.controlIco', toggleControl);
        },
        render: function () {
            return <nav id='LeftPanel'>
                <div id='LeftPanelWrapper'>
                    { this.props.pending.length
                        ? <Queue items={this.props.pending}
                                locations={this.props.locations} />
                        : null
                    }

                    <ConsoleOpts day={this.props.day} locations={this.props.locations} />

                    { this.props.router
                        ? <RouterController router={this.props.router}
                            saveRoute={this.props.saveRoute}
                            cancelRoute={this.props.cancelRoute}
                            toggleRouterMode={this.props.toggleRouterMode} />
                        : null
                    }
                    <Tasks routeTasks={this.props.routeTasks}
                            locations={this.props.locations}
                            day={this.props.day}
                            setTaskFocus={this.props.setTaskFocus}
                            selectedTask={this.props.selectedTask}
                            hasGoogleMaps={this.props.hasGoogleMaps}
                            queries={this.props.queries}
                            setQueries={this.props.setQueries} />
                </div>
            </nav>;
        }
    });
    return LeftPanel;
});