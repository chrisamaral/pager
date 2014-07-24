/** @jsx React.DOM */
define(function () {
    var RouterCfg, WorkerCfg, CfgForm;

    /*
        configurar:
            turno de trabalho
            ponto de partida
    */

    WorkerCfg = React.createClass({
        killMe: function () {
            this.props.removeUser(this.props.index);
        },
        render: function () {
            return (
                <div className='row'>
                    <div className='medium-6 columns'>
                        <a title='Descartar' className='wCfgX' onClick={this.killMe}>
                            <i className='fi-x'></i>
                        </a>{this.props.worker.name}
                    </div>
                    <div className='medium-3 columns'>
                        <select className='pointSelector' data-collection='points' data-field='startPoint' data-worker={this.props.worker._id}>
                            {
                                this.props.options.points.map(function (option, index) {
                                    return <option key={index} value={index}>{option.name}</option>;
                                })
                            }
                        </select>
                    </div>
                    <div className='medium-3 columns'>
                        <select className='shiftSelector' data-collection='workShifts' data-field='workShift' data-worker={this.props.worker._id}>
                            {
                                this.props.options.workShifts.map(function (option, index) {
                                    return <option key={index} value={index}>{option.name}</option>;
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
            return <form onSubmit={this.handleSubmit}>
                <div className='cfgForm'>
                    <div className='row'>
                        <div className='medium-6 columns'><strong>Nome</strong></div>
                        <div className='medium-3 columns'><strong>Partida</strong></div>
                        <div className='medium-3 columns'><strong>Horário</strong></div>
                    </div>

                    <div className='workersCfg'>
                        {this.props.workers.map(function (worker, index) {
                            return <WorkerCfg index={index} worker={worker} removeUser={this.props.removeUser} key={worker._id} options={this.props.options} />;
                        }.bind(this))}
                    </div>

                    <div className='row'>
                        <div className='medium-12 columns text-right'>
                            <button className='small alert button' onClick={this.cancel}>Cancelar</button>
                            <button className='small success button'>Salvar</button>
                        </div>
                    </div>
                </div>
            </form>;
        }
    });

    RouterCfg = React.createClass({
        
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
        
        render: function () {
            return (<div>
                {this.state.options && this.state.workers
                    ? <CfgForm options={this.state.options} removeUser={this.killUserAt} workers={this.state.workers} submitWorkers={this.props.onSet} />
                    : <p><i>Carregando Opções...</i></p>
                }
            </div>);
        }
    });

    return RouterCfg;
});