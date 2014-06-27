/** @jsx React.DOM */
define(function () {
    var RouterCfg, WorkerCfg, CfgForm;

    /*
        configurar:
            turno de trabalho
            ponto de partida
    */

    WorkerCfg = React.createClass({
        render: function () {
            return (
                <div className='row'>
                    <div className='small-6 columns'>
                        <a title='Descartar' className='wCfgX'>
                            <i className='fi-x'></i>
                        </a>{this.props.worker.name}
                    </div>
                    <div className='small-3 columns'>
                        <select className='pointSelector' data-worker={this.props.worker._id}>
                            {
                                this.props.options.points.map(function (option, index) {
                                    return <option key={index} value={index}>{option.address}</option>;
                                })
                            }
                        </select>
                    </div>
                    <div className='small-3 columns'>
                        <select className='shiftSelector' data-worker={this.props.worker._id}>
                            {
                                this.props.options.workShifts.map(function (option, index) {
                                    return <option key={index} value={index}>
                                                {option.from + ' <> ' + option.to}</option>;
                                })
                            }
                        </select>
                    </div>
                </div>
            )
        }
    });

    CfgForm = React.createClass({
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
            return <form onSubmit={this.handleSubmit}>
                <div className='cfgForm'>
                    <div className='row'>
                        <div className='small-6 columns'><strong>Nome</strong></div>
                        <div className='small-3 columns'><strong>Partida</strong></div>
                        <div className='small-3 columns'><strong>Horário</strong></div>
                    </div>

                    <div className='workersCfg'>
                        {this.props.workers.map(function (worker) {
                            return <WorkerCfg worker={worker} key={worker._id} options={this.props.options} />;
                        }.bind(this))}
                    </div>

                    <div className='row'>
                        <div className='small-12 columns text-right'>
                            <button className='alert button'>Cancelar</button>
                            <button className='success button'>Salvar</button>
                        </div>
                    </div>
                </div>
            </form>;
        }
    });

    RouterCfg = React.createClass({
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
            return (<div>
                {this.state.options
                    ? <CfgForm options={this.state.options} workers={this.props.workers} submitWorkers={this.props.onSet} />
                    : <p><i>Carregando Opções...</i></p>
                }
            </div>);
        }
    });

    return RouterCfg;
});