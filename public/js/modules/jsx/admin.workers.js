/** @jsx React.DOM */

define(function () {

    var UserSelector = React.createClass({
        render: function () {
            return <select defaultValue={this.props.selected || ''} >
                <option value=''>{'########## Nenhum #########'}</option>
                {this.props.users.map(function (user) {
                    return <option key={user.id} value={user.id}>{user.name}</option>;
                })}
            </select>;
        }
    });

    var EditWorkerForm = React.createClass({

        getInitialState: function () {
            return {locked: false};
        },

        selectUser: function (userID) {
            var usr = _.find(this.props.users, {id: userID}),
                nameElem = this.refs.workerName.getDOMNode();

            if (!usr) return;
            if (nameElem.name === '') nameElem.value = usr.name;
        },

        handleSubmit: function (e) {
            e.preventDefault();

            var new_worker = {
                sys_id: this.refs.sys_id.getDOMNode().value,
                name: this.refs.name.getDOMNode().value,
                user_id: this.refs.user_id.getDOMNode().value
            };
            if (this.props.worker._id) new_worker._id = this.props.worker._id;

            this.setState({locked: true});

            this.props.saveWorker(new_worker)

                .always(function () {
                    this.setState({locked: false});
                }.bind(this))
                .done(function () {
                    if (!this.props.worker._id) {
                        this.refs.sys_id.getDOMNode().value = this.props.worker.sys_id;
                        this.refs.name.getDOMNode().value = this.props.worker.name;
                        this.refs.user_id.getDOMNode().value = this.props.worker.user_id;
                    }
                }.bind(this))
                .fail(function () {
                    $(this.getDOMNode()).prepend(
                        React.renderComponentToStaticMarkup(<div data-alert className="radius alert alert-box">
                            Erro, não foi possível salvar.
                            <a href="#" className="close">{'×'}</a>
                        </div>)
                    ).foundation()
                }.bind(this));
        },
        delete: function (e) {
            e.preventDefault();
            this.props.deleteWorker(this.props.worker._id);
        },
        render: function () {
            return <div className='panel'>
                <form>
                    <div className='row'>
                        <div className='small-4 large-3 columns'>
                            <label>Código
                                <input type='text' placeholder='###' ref='sys_id' defaultValue={this.props.worker.sys_id} />
                           </label>
                        </div>
                        <div className='small-8 large-9 columns'>
                            <label>Nome
                                <input type='text' ref='workerName' required={true} placeholder='Nome' ref='name' defaultValue={this.props.worker.name} />
                            </label>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='large-12 columns'>
                            <label>Usuário Associado
                                <UserSelector ref='user_id' selected={this.props.worker.user_id}
                                    users={this.props.users} selectUser={this.selectUser} />
                            </label>
                        </div>
                    </div>
                    <div className='row'>
                        <div className='large-12 columns text-right'>
                            {!this.state.locked
                                ?
                                    <div>

                                        <button onClick={this.handleSubmit} className='small buton success'>Salvar</button>
                                        {this.props.deleteWorker
                                            ? <button onClick={this.delete} className='small button alert'>Remover</button>
                                            : null
                                            }

                                    </div>

                                : <strong>Salvando...</strong>
                            }
                        </div>
                    </div>
                </form>
            </div>;
        }
    });

    var WorkerHeader = React.createClass({

        toggle: function () {
            this.props.toggleEditor(this.props.worker._id);
        },

        render: function () {
            return <div className='row'>
                <div className='small-9 columns'>
                    <h5><strong>{this.props.worker.name}</strong></h5>
                </div>
                <div className='small-3 columns text-right'>
                    {this.props.worker.editable
                        ?
                            <a onClick={this.toggle}>
                                <i className='actionIco fi-x'></i>
                                Cancelar
                            </a>
                        :
                            <a onClick={this.toggle}>
                                <i className='actionIco fi-pencil'></i>
                                Editar
                            </a>

                        }
                </div>
            </div>;
        }
    });

    var WorkerList = React.createClass({
        render: function () {
            return <div>
                {this.props.workers.map(function (worker) {
                    return <div className='WorkerHeader' key={worker._id}>
                        <WorkerHeader worker={worker} toggleEditor={this.props.toggleEdit} />

                            {worker.editable
                                ? <EditWorkerForm users={this.props.users} worker={worker}
                                    saveWorker={this.props.saveWorker} deleteWorker={this.props.deleteWorker} />
                                : null}

                    </div>;

                }.bind(this))}
            </div>;
        }
    });


    var Workers = React.createClass({

        getInitialState: function () {
            return {
                defaultWorker: {name: '', sys_id: '', user_id: ''},
                workers: [],
                users: []
            };
        },

        toggleEdit: function (workerID) {
            var ws = this.state.workers,
                w = _.find(ws, {_id: workerID});

            if (!w) return;

            w.editable = !w.editable;
            this.setState({workers: ws});

        },
        deleteWorker: function (workerID) {
            return $.ajax({
                        type: 'DELETE',
                        url: pager.urls.ajax + 'admin/worker/' + workerID
                    }).done(function () {
                        var workers = this.state.workers;
                        _.remove(workers, {_id: workerID});
                        this.setState({workers: workers});
                    }.bind(this));
        },
        saveWorker: function (worker) {

            if (worker.editable) worker = _.omit(worker, 'editable');

            return $.ajax({
                        type: 'POST',
                        url: pager.urls.ajax + 'admin/worker' + (worker._id ? '/' + worker._id : ''),
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify({worker: worker})
                    }).done(function () {
                        if (worker._id) {
                            var ws = this.state.workers,
                                w = _.find(ws, {_id: worker._id});

                            if (!w) return;

                            _.merge(w, worker);

                            this.setState({workers: ws});

                        } else {
                            this.reloadWorkers()
                        }
                    }.bind(this));
        },

        setWorkers: function (ws) {
            this.setState({workers: ws});
        },

        setUsers: function (us) {
            this.setState({users: us});
        },

        reloadUsers: function () {
            $.get(pager.urls.ajax + 'admin/users')
                .done(this.setUsers);
        },

        reloadWorkers: function () {
            $.get(pager.urls.ajax + 'admin/workers')
                .done(this.setWorkers);
        },
        componentDidMount: function () {
            this.reloadUsers();
            this.reloadWorkers();
        },

        render: function () {
            return <div>

                <WorkerList workers={this.state.workers} users={this.state.users}
                    deleteWorker={this.deleteWorker} toggleEdit={this.toggleEdit} saveWorker={this.saveWorker}  />

                <EditWorkerForm deleteWorker={this.deleteWorker}
                    saveWorker={this.saveWorker} worker={this.state.defaultWorker} users={this.state.users} />
            </div>;
        }
    });

    return Workers;
});