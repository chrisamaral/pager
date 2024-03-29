/** @jsx React.DOM */

define(function () {

    var UserSelector = React.createClass({displayName: 'UserSelector',
        handleChange: function (e) {
            e.currentTarget.value && this.props.selectUser(e.currentTarget.value);
        },
        render: function () {
            return React.DOM.select({defaultValue: this.props.selected || '', onChange: this.handleChange}, 
                React.DOM.option({value: ""}, '########## Nenhum #########'), 
                this.props.users.map(function (user) {
                    return React.DOM.option({key: user.id, value: user.id}, user.name);
                })
            );
        }
    });

    var ShiftSelector = React.createClass({displayName: 'ShiftSelector',
        render: function () {
            return React.DOM.select({defaultValue: this.props.selected || ''}, 
                React.DOM.option({value: ""}, '########## Nenhum #########'), 
                this.props.shifts.map(function (shift) {
                    return React.DOM.option({key: shift._id, value: shift._id}, shift.name + '    ∙   ' + shift.from + ' <> ' + shift.to);
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
                nameElem = this.refs.name.getDOMNode();

            if (!usr) return;
            if (nameElem.value === '') nameElem.value = usr.name;
        },

        handleSubmit: function (e) {
            e.preventDefault();

            var new_worker = {
                sys_id: this.refs.sys_id.getDOMNode().value,
                name: this.refs.name.getDOMNode().value,
                user_id: this.refs.user_id.getDOMNode().value,
                types: [],
                work_shift: this.refs.work_shift.getDOMNode().value
            };

            var $form = $(e.currentTarget);
            $form.find(':checkbox').each(function () {
                if ($(this).is(':checked')) new_worker.types.push($(this).val());
            });

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
                        React.renderComponentToStaticMarkup(React.DOM.div({'data-alert': true, className: "radius alert alert-box"}, 
                            "Erro, não foi possível salvar.", 
                            React.DOM.a({href: "#", className: "close"}, '×')
                        ))
                    ).foundation()
                }.bind(this));
        },
        killMe: function (e) {
            e.preventDefault();
            this.props.deleteWorker(this.props.worker._id);
        },
        allTypes: function (e) {
            e.preventDefault();
            $(this.getDOMNode()).find('input:checkbox').prop('checked', true);
        },
        noTypes: function (e) {
            e.preventDefault();
            $(this.getDOMNode()).find('input:checkbox').prop('checked', false);
        },
        render: function () {
            var thisWorker = this.props.worker;
            return React.DOM.div({className: "panel"}, 
                React.DOM.form({onSubmit: this.handleSubmit}, 
                    React.DOM.div({className: "row"}, 
                        React.DOM.div({className: "medium-8 columns"}, 
                            React.DOM.div({className: "row"}, 
                                React.DOM.div({className: "medium-4 large-3 columns"}, 
                                    React.DOM.label(null, "Código", 
                                        React.DOM.input({type: "text", placeholder: "0000", ref: "sys_id", defaultValue: thisWorker.sys_id})
                                    )
                                ), 
                                React.DOM.div({className: "medium-8 large-9 columns"}, 
                                    React.DOM.label(null, "Nome", 
                                        React.DOM.input({type: "text", required: true, placeholder: "Nome", ref: "name", defaultValue: thisWorker.name})
                                    )
                                )
                            ), 
                            React.DOM.div({className: "row"}, 
                                React.DOM.div({className: "large-12 columns"}, 
                                    React.DOM.label(null, "Usuário Associado", 
                                        UserSelector({ref: "user_id", selected: thisWorker.user_id, 
                                        users: this.props.users, selectUser: this.selectUser})
                                    )
                                )
                            ), 
                            React.DOM.div({className: "row"}, 
                                React.DOM.div({className: "large-12 columns"}, 
                                    React.DOM.label(null, "Horário de Trabalho", 
                                        ShiftSelector({ref: "work_shift", selected: thisWorker.work_shift, shifts: this.props.shifts})
                                    )
                                )
                            ), 
                            React.DOM.div({className: "row"}, 
                                React.DOM.div({className: "large-12 columns text-right"}, 
                            !this.state.locked
                                ?
                                React.DOM.div({className: "AdmWBtRow"}, 

                                    React.DOM.button({className: "small buton success"}, "Salvar"), 
                                        this.props.deleteWorker
                                            ? React.DOM.button({onClick: this.killMe, className: "small button alert"}, "Remover")
                                            : null
                                            
                                )
                                : React.DOM.strong(null, "Carregando...")
                                
                                )
                            )
                        ), 
                        React.DOM.div({className: "medium-4 columns"}, 
                            React.DOM.p({className: "text-right"}, 
                                React.DOM.button({onClick: this.allTypes, className: "tiny button fi-check"}, "Todos"), 
                                React.DOM.button({onClick: this.noTypes, className: "tiny button alert fi-x"}, "Nenhum")
                            ), 
                            this.props.availableTypes.map(function (t) {
                                var type = t.name;
                                var $id = thisWorker._id || Math.random().toString(36).substr(2);

                                return React.DOM.div({className: "row", key: type}, 
                                    React.DOM.div({className: "medium-12 columns"}, 
                                        React.DOM.input({id: 'tagType' + type + $id, type: "checkbox", value: type, 
                                            defaultChecked: _.isArray(thisWorker.types) && thisWorker.types.indexOf(type) >= 0}), 
                                        React.DOM.label({className: "textCapitalize", htmlFor: 'tagType' + type + $id}, type)
                                    )
                                );
                            })
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
            return React.DOM.div({className: "row"}, 
                React.DOM.div({className: "medium-9 columns"}, 
                    React.DOM.h5(null, React.DOM.strong(null, this.props.worker.name))
                ), 
                React.DOM.div({className: "medium-3 columns text-right"}, 
                    this.props.worker.editable
                        ?
                            React.DOM.a({onClick: this.toggle}, 
                                React.DOM.i({className: "actionIco fi-x"}), 
                                "Cancelar"
                            )
                        :
                            React.DOM.a({onClick: this.toggle}, 
                                React.DOM.i({className: "actionIco fi-pencil"}), 
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
                    return React.DOM.div({className: "WorkerHeader", key: worker._id}, 
                        WorkerHeader({worker: worker, toggleEditor: this.props.toggleEdit}), 

                            worker.editable
                                ? EditWorkerForm({users: this.props.users, worker: worker, availableTypes: this.props.availableTypes, shifts: this.props.shifts, 
                                    saveWorker: this.props.saveWorker, deleteWorker: this.props.deleteWorker})
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
                users: [],
                shifts: [],
                availableTypes: []
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

            $.get(pager.urls.ajax + 'admin/types')
                .done(function (types) {
                    this.setState({availableTypes: types});
                }.bind(this));

            $.get(pager.urls.ajax + 'admin/work_shifts')
                .done(function (s) {

                    if (!this.isMounted()) return;

                    this.setState({shifts: s});
                }.bind(this))

        },

        render: function () {
            return React.DOM.div(null, 

                WorkerList({availableTypes: this.state.availableTypes, workers: this.state.workers, users: this.state.users, shifts: this.state.shifts, 
                    deleteWorker: this.deleteWorker, toggleEdit: this.toggleEdit, saveWorker: this.saveWorker}), 

                EditWorkerForm({availableTypes: this.state.availableTypes, shifts: this.state.shifts, 
                    saveWorker: this.saveWorker, worker: this.state.defaultWorker, users: this.state.users})
            );
        }
    });

    return Workers;
});