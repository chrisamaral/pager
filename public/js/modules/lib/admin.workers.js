/** @jsx React.DOM */

define(function () {

    var UserSelector = React.createClass({displayName: 'UserSelector',
        render: function () {
            return React.DOM.select( {defaultValue:this.props.selected || ''} , 
                React.DOM.option( {value:""}, '########## Nenhum #########'),
                this.props.users.map(function (user) {
                    return React.DOM.option( {key:user.id, value:user.id}, user.name);
                })
            );
        }
    });

    var EditWorkerForm = React.createClass({displayName: 'EditWorkerForm',

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
                    if (!this.isMounted()) return;
                    this.setState({locked: false});
                }.bind(this))
                .done(function () {
                    if (!this.isMounted()) return;
                    if (!this.props.worker._id) {
                        this.refs.sys_id.getDOMNode().value = this.props.worker.sys_id;
                        this.refs.name.getDOMNode().value = this.props.worker.name;
                        this.refs.user_id.getDOMNode().value = this.props.worker.user_id;
                    }
                }.bind(this))
                .fail(function () {
                    if (!this.isMounted()) return;
                    $(this.getDOMNode()).prepend(
                        React.renderComponentToStaticMarkup(React.DOM.div( {'data-alert':true, className:"radius alert alert-box"}, 
                            "Erro, não foi possível salvar.",
                            React.DOM.a( {href:"#", className:"close"}, '×')
                        ))
                    ).foundation()
                }.bind(this));
        },
        delete: function (e) {
            e.preventDefault();
            this.props.deleteWorker(this.props.worker._id);
        },
        render: function () {
            return React.DOM.div( {className:"panel"}, 
                React.DOM.form( {onSubmit:this.handleSubmit}, 
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"small-4 large-3 columns"}, 
                            React.DOM.label(null, "Código",
                                React.DOM.input( {type:"text", placeholder:"###", ref:"sys_id", defaultValue:this.props.worker.sys_id} )
                           )
                        ),
                        React.DOM.div( {className:"small-8 large-9 columns"}, 
                            React.DOM.label(null, "Nome",
                                React.DOM.input( {type:"text", ref:"workerName", required:true, placeholder:"Nome", ref:"name", defaultValue:this.props.worker.name} )
                            )
                        )
                    ),
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"large-12 columns"}, 
                            React.DOM.label(null, "Usuário Associado",
                                UserSelector( {ref:"user_id", selected:this.props.worker.user_id,
                                    users:this.props.users, selectUser:this.selectUser} )
                            )
                        )
                    ),
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"large-12 columns text-right"}, 
                            !this.state.locked
                                ?
                                    React.DOM.div( {className:"AdmWBtRow"}, 

                                        React.DOM.button( {className:"small buton success"}, "Salvar"),
                                        this.props.deleteWorker
                                            ? React.DOM.button( {onClick:this.delete, className:"small button alert"}, "Remover")
                                            : null
                                            

                                    )

                                : React.DOM.strong(null, "Carregando...")
                            
                        )
                    )
                )
            );
        }
    });

    var WorkerHeader = React.createClass({displayName: 'WorkerHeader',

        toggle: function () {
            this.props.toggleEditor(this.props.worker._id);
        },

        render: function () {
            return React.DOM.div( {className:"row"}, 
                React.DOM.div( {className:"small-9 columns"}, 
                    React.DOM.h5(null, React.DOM.strong(null, this.props.worker.name))
                ),
                React.DOM.div( {className:"small-3 columns text-right"}, 
                    this.props.worker.editable
                        ?
                            React.DOM.a( {onClick:this.toggle}, 
                                React.DOM.i( {className:"actionIco fi-x"}),
                                "Cancelar"
                            )
                        :
                            React.DOM.a( {onClick:this.toggle}, 
                                React.DOM.i( {className:"actionIco fi-pencil"}),
                                "Editar"
                            )

                        
                )
            );
        }
    });

    var WorkerList = React.createClass({displayName: 'WorkerList',
        render: function () {
            return React.DOM.div(null, 
                this.props.workers.map(function (worker) {
                    return React.DOM.div( {className:"WorkerHeader", key:worker._id}, 
                        WorkerHeader( {worker:worker, toggleEditor:this.props.toggleEdit} ),

                            worker.editable
                                ? EditWorkerForm( {users:this.props.users, worker:worker,
                                    saveWorker:this.props.saveWorker, deleteWorker:this.props.deleteWorker} )
                                : null

                    );

                }.bind(this))
            );
        }
    });


    var Workers = React.createClass({displayName: 'Workers',

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
                        if (!this.isMounted()) return;
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
                        if (!this.isMounted()) return;
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
            if (!this.isMounted()) return;
            this.setState({workers: ws});
        },

        setUsers: function (us) {
            if (!this.isMounted()) return;
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
            return React.DOM.div(null, 

                WorkerList( {workers:this.state.workers, users:this.state.users,
                    deleteWorker:this.deleteWorker, toggleEdit:this.toggleEdit, saveWorker:this.saveWorker}  ),

                EditWorkerForm( {deleteWorker:this.deleteWorker,
                    saveWorker:this.saveWorker, worker:this.state.defaultWorker, users:this.state.users} )
            );
        }
    });

    return Workers;
});