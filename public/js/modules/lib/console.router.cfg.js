/** @jsx React.DOM */
define(function () {
    var RouterCfg, WorkerCfg, CfgForm;

    /*
        configurar:
            turno de trabalho
            ponto de partida
    */

    WorkerCfg = React.createClass({displayName: 'WorkerCfg',
        killMe: function () {
            this.props.removeUser(this.props.index);
        },
        render: function () {
            return (
                React.DOM.div({className: "row"}, 
                    React.DOM.div({className: "medium-6 columns"}, 
                        React.DOM.a({title: "Descartar", className: "wCfgX", onClick: this.killMe}, 
                            React.DOM.i({className: "fi-x"})
                        ), this.props.worker.name
                    ), 
                    React.DOM.div({className: "medium-3 columns"}, 
                        React.DOM.select({className: "pointSelector", 'data-collection': "points", 'data-field': "startPoint", 'data-worker': this.props.worker._id}, 
                            
                                this.props.options.points.map(function (option, index) {
                                    return React.DOM.option({key: index, value: index}, option.name);
                                })
                            
                        )
                    ), 
                    React.DOM.div({className: "medium-3 columns"}, 
                        React.DOM.select({className: "shiftSelector", 'data-collection': "workShifts", 'data-field': "workShift", 'data-worker': this.props.worker._id}, 
                            
                                this.props.options.workShifts.map(function (option, index) {
                                    return React.DOM.option({key: index, value: index}, option.name);
                                })
                            
                        )
                    )
                )
            )
        }
    });

    CfgForm = React.createClass({displayName: 'CfgForm',
        handleSubmit: function (e) {
            e.preventDefault();

            var workers = this.props.workers, me = this;

            var elem = $(this.getDOMNode());

            elem.find('.pointSelector,.shiftSelector').each(function () {

                var worker = _.find(workers, {_id: $(this).data('worker')}), key, option, val;

                if (!worker) return true;

                key = $(this).data('field');
                option = $(this).data('collection');
                val = _.cloneDeep(me.props.options[option][$(this).val()]);

                worker[key] = key === 'startPoint' ? val.location : val;

            });

            this.props.submitWorkers(workers);
        },
        cancel: function (e) {
            e.preventDefault();
            this.props.submitWorkers(null);
        },
        
        render: function () {
            return React.DOM.form({onSubmit: this.handleSubmit}, 
                React.DOM.fieldset(null, 
                    React.DOM.legend(null, "Técnicos"), 
                    React.DOM.div({className: "row"}, 
                        React.DOM.div({className: "medium-6 columns"}, React.DOM.strong(null, "Nome")), 
                        React.DOM.div({className: "medium-3 columns"}, React.DOM.strong(null, "Partida")), 
                        React.DOM.div({className: "medium-3 columns"}, React.DOM.strong(null, "Horário"))
                    ), 

                    React.DOM.div({className: "workersCfg"}, 
                        this.props.workers.map(function (worker, index) {
                            return WorkerCfg({index: index, worker: worker, removeUser: this.props.removeUser, key: worker._id, options: this.props.options});
                        }.bind(this))
                    ), 

                    React.DOM.div({className: "row"}, 
                        React.DOM.div({className: "medium-12 columns text-right"}, 
                            React.DOM.button({className: "small alert button", onClick: this.cancel}, "Cancelar"), 
                            React.DOM.button({className: "small success button"}, "Salvar")
                        )
                    )
                )
            );
        }
    });

    RouterCfg = React.createClass({displayName: 'RouterCfg',
        
        getInitialState: function () {
            return {options: null, workers: null};
        },

        componentDidMount: function () {
            $.get(pager.urls.ajax + 'console/routerConfigOptions')
                .done(function (opts) {
                    this.setState({options: opts});
                }.bind(this));

            $.get(pager.urls.ajax + 'console/workers/' + this.props.day)
                .done(function (workers) {
                    this.setState({workers: workers});
                }.bind(this));

            $('#Console').trigger('resize');
        },

        killUserAt: function (index) {
            
            var w = this.state.workers;
            w.splice(index, 1);
            this.setState({workers: w}, function () {
                $('#Console').trigger('resize');
            });
        },
        submitOptions: function (workers) {
            this.props.onSet(workers,
                {
                    balanced: $(this.refs.balancedRoute.getDOMNode()).is(':checked')
                }
            );
        },
        render: function () {
            return (React.DOM.div(null, 
                React.DOM.fieldset(null, 
                    React.DOM.legend(null, "Opções"), 
                    React.DOM.div({className: "row"}, 
                        React.DOM.div({className: "small-12 columns text-left"}, 
                            React.DOM.label(null, "Gerar Rotas Balanceadas", 
                                React.DOM.input({type: "checkbox", ref: "balancedRoute", name: "balancedRoute"})
                            )
                        )
                    )
                ), 
                this.state.options && this.state.workers
                    ? CfgForm({options: this.state.options, removeUser: this.killUserAt, workers: this.state.workers, submitWorkers: this.submitOptions})
                    : React.DOM.p(null, React.DOM.i(null, "Carregando Opções..."))
                
            ));
        }
    });

    return RouterCfg;
});