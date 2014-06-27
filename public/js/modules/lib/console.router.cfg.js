/** @jsx React.DOM */
define(function () {
    var RouterCfg, WorkerCfg, CfgForm;

    /*
        configurar:
            turno de trabalho
            ponto de partida
    */

    WorkerCfg = React.createClass({displayName: 'WorkerCfg',
        render: function () {
            return (
                React.DOM.div( {className:"row"}, 
                    React.DOM.div( {className:"small-6 columns"}, 
                        React.DOM.a( {title:"Descartar", className:"wCfgX"}, 
                            React.DOM.i( {className:"fi-x"})
                        ),this.props.worker.name
                    ),
                    React.DOM.div( {className:"small-3 columns"}, 
                        React.DOM.select( {className:"pointSelector", 'data-worker':this.props.worker._id}, 
                            
                                this.props.options.points.map(function (option, index) {
                                    return React.DOM.option( {key:index, value:index}, option.address);
                                })
                            
                        )
                    ),
                    React.DOM.div( {className:"small-3 columns"}, 
                        React.DOM.select( {className:"shiftSelector", 'data-worker':this.props.worker._id}, 
                            
                                this.props.options.workShifts.map(function (option, index) {
                                    return React.DOM.option( {key:index, value:index}, 
                                                option.from + ' <> ' + option.to);
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

                key = $(this).is('.pointSelector') ? 'workShift' : 'startingPoint';
                option = key === 'workShift' ? 'workShifts' : 'points';
                val = me.props.options[option][$(this).val()];

                worker[key] = key === 'startingPoint' ? val.location : val;

            });
            debugger;
            this.props.submitWorkers(workers);
        },
        cancel: function () {
            e.preventDefault();
            this.props.submitWorkers(null);
        },
        render: function () {
            return React.DOM.form( {onSubmit:this.handleSubmit}, 
                React.DOM.div( {className:"cfgForm"}, 
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"small-6 columns"}, React.DOM.strong(null, "Nome")),
                        React.DOM.div( {className:"small-3 columns"}, React.DOM.strong(null, "Partida")),
                        React.DOM.div( {className:"small-3 columns"}, React.DOM.strong(null, "Horário"))
                    ),

                    React.DOM.div( {className:"workersCfg"}, 
                        this.props.workers.map(function (worker) {
                            return WorkerCfg( {worker:worker, key:worker._id, options:this.props.options} );
                        }.bind(this))
                    ),

                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"small-12 columns text-right"}, 
                            React.DOM.button( {className:"alert button"}, "Cancelar"),
                            React.DOM.button( {className:"success button"}, "Salvar")
                        )
                    )
                )
            );
        }
    });

    RouterCfg = React.createClass({displayName: 'RouterCfg',
        getInitialState: function () {
            return {options: null};
        },
        componentDidMount: function () {
            $.get(pager.urls.ajax + 'console/routerConfigOptions')
                .done(function (opts) {
                    this.setState({options: opts});
                }.bind(this));
            $('#ScrollRoot').trigger('resize');
        },
        componentDidUpdate: function () {
            //$('#ScrollRoot').trigger('resize');
        },

        render: function () {
            return (React.DOM.div(null, 
                this.state.options
                    ? CfgForm( {options:this.state.options, workers:this.props.workers, submitWorkers:this.props.onSet} )
                    : React.DOM.p(null, React.DOM.i(null, "Carregando Opções..."))
                
            ));
        }
    });

    return RouterCfg;
});