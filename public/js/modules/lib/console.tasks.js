/** @jsx React.DOM */
define(['../helpers/utils', './component.DateInput'], function (utils, DateInput) {
    var Tasks,
        TaskInput,
        FilterList,
        FilterItem,
        TxtInput,
        QueryElem,
        QueryInfoDropDown,
        QueryTask,
        LookupProgress,
        filterName = {
            schedule: "Agenda::Ordem",
            task_id: "Código::Ordem",
            creation: "Ingresso::Ordem",
            task_status: "Status::Ordem",
            task_type: "Tipo::Ordem",
            customer_id: "Código::Cliente",
            customer_name: "Nome::Cliente",
            address: "Endereço::Cliente"
        };


    TxtInput = React.createClass({displayName: 'TxtInput',
        render: function () {
            return React.DOM.input( {name:this.props.inputName, required:true, autoComplete:"on", type:"text", defaultValue:"", placeholder:this.props.name}  );
        }
    });

    FilterItem = React.createClass({displayName: 'FilterItem',
        killFilter: function(e){
            e.preventDefault();
            this.props.removeFilter(this.props.index);
        },
        render: function () {
            var FilterInput;

            switch (this.props.id) {
                case 'schedule':
                case 'creation':
                    FilterInput = DateInput;
                    break;
                default:
                    FilterInput = TxtInput;
                    break;
            }

            return React.DOM.div( {className:"row"}, 
                React.DOM.div( {className:"large-12 columns text-right"}, 
                    React.DOM.label(null, 
                        React.DOM.strong(null, this.props.name,
                            React.DOM.a( {onClick:this.killFilter},  " - " )
                        ),
                        FilterInput( {id:this.props.id, name:this.props.name, inputName:this.props.id} )
                    )
                )
            )
        }
    });

    FilterList = React.createClass({displayName: 'FilterList',
        handleSubmit: function (e) {
            e.preventDefault();
            var vals = $(e.currentTarget).serializeArray(), parsed = {};

            _.forEach(vals, function(item){
                if (!item || (_.isString(item.value) && !item.value.length)) {
                    return;
                }
                parsed[item.name] = parsed[item.name] || [];
                parsed[item.name].push(item.value);
            });

            $.get(pager.urls.ajax + 'console/tasks', parsed)
                .done(function (tasks) {
                    if(!_.isArray(tasks)){
                        return;
                    }
                    
                    this.props.pushQuery(parsed, tasks);

                }.bind(this));
        },
        render: function () {
            var fs = this.props.filters.map(function (filter, index) {
                    var _id = Foundation.utils.random_str(10);
                    return FilterItem(
                                {key:filter.key,
                                index:index,
                                id:filter.id, name:filter.name,
                                removeFilter:this.props.removeFilter} );
                }.bind(this));
            return React.DOM.div( {className:"filter-list panel"}, 
                React.DOM.form( {onSubmit:this.handleSubmit}, 
                    fs,
                    React.DOM.div( {className:"row"}, 
                        React.DOM.div( {className:"large-12 columns text-right"}, 
                            React.DOM.button( {type:"submit", className:"tiny success button"}, "Buscar")
                        )
                    )
                )
            );
        }
    });
    
    QueryInfoDropDown = React.createClass({displayName: 'QueryInfoDropDown',
        render: function () {
            return (React.DOM.div( {'data-dropdown-content':true, className:"f-dropdown content medium hide", id:this.props.id}, 
                React.DOM.h4( {className:"subheader"}, (this.props.count || 'Nenhuma') + (this.props.count > 1 ? ' ordens' : ' ordem')),
                React.DOM.table( {className:"queryInfoDropDownTable"}, 
                    React.DOM.tbody(null, 
                        _.map(this.props.query, function (item, key) {
                            return (
                                React.DOM.tr( {key:key}, 
                                    React.DOM.td(null, filterName[key]),
                                    React.DOM.td(null, 
                                        item.map(function(val, index){
                                            return React.DOM.span( {key:index, className:"round secondary label"}, val);
                                        })
                                    )
                                )
                            );
                        })
                    )
                )
            ));
        }
    });
    QueryTask = React.createClass({displayName: 'QueryTask',
        getInitialState: function () {
            return {id: 'Q' + Math.random().toString(36).substr(2), hasLocation: false};
        },
        renderDropdown: function (props) {
            props = props || this.props;

            $('#' + this.state.id + 'Menu').remove();
            var menu =  $(React.renderComponentToString(
                React.DOM.ul( {id:this.state.id + 'Menu', className:"tiny f-dropdown hide", 'data-dropdown-content':true}, 
                    React.DOM.li(null, React.DOM.a( {id:this.state.id + 'killMe'}, "Descartar"))
                ))).appendTo('body');

            $('#' + this.state.id + 'killMe').click(this.killMe);

            if (this.state.hasLocation !== !!props.task.location) {
                this.setState({hasLocation: !!props.task.location});
            }
            menu.foundation();
        },
        componentDidMount: function () {
            this.renderDropdown();
        },
        componentWillReceiveProps: function (newProps) {
            if (newProps.task.location && !this.state.hasLocation) {
                this.renderDropdown(newProps);
            }
        },
        componentWillUnmount: function () {
            $('#' + this.state.id + 'Menu').remove();
        },
        killMe: function () {
            this.props.removeTask(this.props.index);
            $('#' + this.state.id + 'Menu').remove();
            if (this.props.selectedTask === this.props.task._id) {
                this.mapFocusOnMe();
            }
        },
        mapFocusOnMe: function () {
            this.props.setTaskFocus(this.props.task._id);
        },
        render: function () {
            var AttrTable = pager.components.AttrTable, classes = React.addons.classSet({
                queryTask: true,
                selectedTask: this.props.selectedTask === this.props.task._id
            });
            return React.DOM.div( {className:classes, 'data-task':this.props.task._id}, 
                React.DOM.span( {className:"icos"}, 
                     this.props.task.location && React.DOM.a( {className:"radius ico fi-target-two", onClick:this.mapFocusOnMe, title:"Selecionar"}), 
                    React.DOM.a( {className:"radius ico fi-list", title:"Menu", 'data-dropdown':this.state.id + 'Menu'})
                ),
                AttrTable( {attrs:this.props.task.attrs} )
            );
        }
    });
    LookupProgress = React.createClass({displayName: 'LookupProgress',

        getInitialState: function () {
            return {
                lookupProgress: null,
                alreadyStartedLookup: false
            };
        },

        startGeoLookup: function () {

            if (this.state.alreadyStartedLookup) {
                return;
            }

            this.setState({alreadyStartedLookup: true});

            require(['../lib/task.geocoder'], function (Geocoder) {
                var g = new Geocoder(this.props.tasks);

                g.onProgress = function (completed, total, currentTask, status) {

                    if (!this.isMounted()) {
                        return g.abort();
                    }

                    try{

                        this.setState({
                            lookupProgress: total ? Math.floor(100 * completed / total) : null
                        }, function () {
                            if (status !== 'unchanged') {
                                this.props.updateTask(currentTask);
                            }
                        }.bind(this));


                    } catch (e) {
                        g.abort();
                        throw e;
                    }

                }.bind(this);

                g.onComplete = function () {
                    setTimeout(function(){
                        this.setState({
                            lookupProgress: null
                        });
                    }.bind(this), 1000 * 2);

                }.bind(this);

                g.init();
            }.bind(this));

        },

        componentWillReceiveProps: function (newProps) {
            if (newProps.hasGoogleMaps) {
                this.startGeoLookup();
            }
        },
        componentDidMount: function () {
            if (this.props.hasGoogleMaps) {
                this.startGeoLookup();
            }
        },
        render: function () {
            var style = {};
            if (this.state.lookupProgress === null) {
                style.display = 'none';
            }
            return React.DOM.progress( {style:style, value:this.state.lookupProgress, max:100, title:this.state.lookupProgress + '% das ordens foram localizadas'} );
        }
    });
    QueryElem = React.createClass({displayName: 'QueryElem',

        getInitialState: function(){
            return {
                taskLength: this.props.query.tasks.length,
                auxId: 'q' + Math.random().toString(36).substr(2)
            };
        },

        killMe: function (e) {
            e.preventDefault();
            this.props.popQuery(this.props.index);
        },

        routeMe: function(e) {
            e.preventDefault();
            this.props.routeThem(this.props.query.tasks);
        },

        cleanDropdown: function () {
            $('#' + this.state.auxId + 'Menu').remove();
            $('#' + this.state.auxId + 'Info').remove();
        },

        renderDropdown: function () {
            this.cleanDropdown();
            var menu = 
                $(React.renderComponentToString(
                    React.DOM.ul( {id:this.state.auxId + 'Menu', className:"tiny f-dropdown hide", 'data-dropdown-content':true}, 
                        React.DOM.li(null, React.DOM.a( {id:this.state.auxId + 'routeMe'}, "Rotear")),
                        React.DOM.li(null, React.DOM.a( {id:this.state.auxId + 'killMe'}, "Descartar"))
                    ))).appendTo('body'),
                info =
                    $(React.renderComponentToString(
                        QueryInfoDropDown(
                                {id:this.state.auxId + 'Info',
                                count:this.props.query.tasks.length,
                                query:this.props.query.query} ))).appendTo('body');

            $('#' + this.state.auxId + 'killMe').click(this.killMe);
            $('#' + this.state.auxId + 'routeMe').click(this.routeMe);

            $([this.getDOMNode(), menu[0], info[0]]).foundation();
        },

        componentDidMount: function () {
            this.renderDropdown();
        },

        componentWillUnmount: function () {
            this.cleanDropdown();
        },

        componentDidUpdate: function () {
            if (this.props.query.tasks.length !== this.state.taskLength) {
                this.renderDropdown();
                this.setState({taskLength: this.props.query.tasks.length});
            }
        },

        removeTask: function (index) {
            var tasks = this.props.query.tasks;
            tasks.splice(index, 1);
            this.setTasks(tasks);
        },

        updateTask: function (task) {
            var tasks = this.props.query.tasks,
                index = _.findIndex(tasks, {_id: task._id});

            if(index < 0) {
                return;
            }

            tasks[index] = task;
            this.setTasks(tasks);
        },

        setTasks: function (tasks) {
            var n_query = this.props.query;
            n_query.tasks = tasks;
            this.props.setQuery(n_query, this.props.index);
        },

        toggleTasks: function (e) {
            e.preventDefault();
            $(this.refs.tasks.getDOMNode()).toggle();
        },

        render: function () {
            var noPropagation = function(e){e.stopPropagation();};
            return (
                React.DOM.div( {className:"panel sequential queryResult"}, 
                    React.DOM.h5( {className:"clearfix", onClick:this.toggleTasks}, 
                        this.props.query.name ? this.props.query.name : null,
                        React.DOM.a( {onClick:noPropagation, className:"right radius ico fi-info", title:"Informação", 'data-dropdown':this.state.auxId + 'Info'}),
                        React.DOM.a( {onClick:noPropagation, className:"right radius ico fi-list", title:"Menu", 'data-dropdown':this.state.auxId + 'Menu'})
                    ),
                    LookupProgress( {updateTask:this.updateTask, tasks:this.props.query.tasks, hasGoogleMaps:this.props.hasGoogleMaps} ),
                    React.DOM.div( {ref:"tasks", className:"QueryElem no-flow-x"}, 
                        this.props.query.tasks.map(function (task, index) {
                            return QueryTask( {key:task._id, index:index, task:task,
                                        setTaskFocus:this.props.setTaskFocus,
                                        selectedTask:this.props.selectedTask,
                                        removeTask:this.removeTask} );
                        }.bind(this))
                    )
                )
            );
        }
    });

    TaskInput = React.createClass({displayName: 'TaskInput',
        getInitialState: function () {
            return {
                filters: []
            };
        },
        pushQuery: function (query, tasks) {
            var queries = this.props.queries, n_query = {};
            
            n_query.query = query;
            n_query.tasks = tasks;

            queries.push(n_query);
            this.props.setQueries(queries);
            this.setState({filters: []});
        },
        setQuery: function(query, index){
            var queries = this.props.queries;
            queries[index] = query;
            this.props.setQueries(queries);
        },
        popQuery: function (index) {
            var queries = this.props.queries.concat();
            queries.splice(index, 1);
            this.props.setQueries(queries);
        },
        removeFilter: function(index) {
            var fs = [].concat(this.state.filters);
            fs.splice(index, 1);
            this.setState({filters: fs});
        },
        createFilter: function (e) {
            e.preventDefault();

            var filters = this.state.filters,
                $type = this.refs.filterType.getDOMNode();

            filters.push({
                id: $type.value,
                key: 'filter-' + Math.random().toString(36).substr(2),
                name: $($type).find('option:selected').text()
            });
            this.setState({filters: filters});
        },
        createTask: function (e) {
            e.preventDefault();
        },
        render: function () {
            return (
                React.DOM.div( {className:"TaskInput panel contained"}, 
                    React.DOM.form( {onSubmit:this.createFilter}, 
                        React.DOM.div(null, 
                            React.DOM.label(null, "Filtrar por",
                                React.DOM.select( {name:"type", ref:"filterType"}, 
                                    _.map(filterName, function(name, key){
                                        return React.DOM.option( {key:key, value:key}, name);
                                    })
                                )
                            )
                        ),
                        React.DOM.div( {className:"row"}, 
                            React.DOM.div( {className:"large-12 columns text-right"}, 
                                React.DOM.button( {disabled:true, className:"tiny secondary button", onClick:this.createTask}, "+ Ordem"),
                                React.DOM.button( {type:"submit", className:"tiny success button"}, "+ Filtro")
                            )
                        )
                    ),
                this.state.filters.length
                    ? FilterList( {removeFilter:this.removeFilter, 
                            filters:this.state.filters, 
                            pushQuery:this.pushQuery} ) : null, 
                    React.DOM.div( {className:"panel sequential contained"}, 
                        this.props.queries.map(function (query, index) {
                            return (
                                QueryElem(
                                    {routeThem:this.props.routeThem,
                                    setTaskFocus:this.props.setTaskFocus,
                                    selectedTask:this.props.selectedTask,
                                    hasGoogleMaps:this.props.hasGoogleMaps,
                                    popQuery:this.popQuery,
                                    setQuery:this.setQuery,
                                    key:query.id,
                                    index:index,
                                    query:query} )
                            );
                        }.bind(this))
                    )
                )
            );
        }
    });

    Tasks = React.createClass({displayName: 'Tasks',

        routeThem: function (tasks) {
            this.props.routeTasks(tasks);
        },

        routeThemAll: function (e) {
            e.stopPropagation();
            var tasks = [];
            this.props.queries.forEach(function(query){
                query.tasks.forEach(function(task){
                    if (!_.any(task,{sys_id: task.sys_id})) {
                        tasks.push(task);
                    }
                });
            });
            this.routeThem(tasks);
        },

        toggleContent: function (e) {
            $(e.currentTarget).next('.panel').toggle();
        },

        render: function () {
            return React.DOM.div( {id:"Tasks"}, 
                React.DOM.h4( {onClick:this.toggleContent}, "Ordens livres",
                    React.DOM.a( {onClick:this.routeThemAll, className:"right radius ico fi-fast-forward", title:"Rotear todos"})
                ),
                TaskInput(
                    {routeThem:this.routeThem,
                    locations:this.props.locations,
                    day:this.props.day,
                    setTaskFocus:this.props.setTaskFocus,
                    selectedTask:this.props.selectedTask,
                    hasGoogleMaps:this.props.hasGoogleMaps,
                    setQueries:this.props.setQueries,
                    queries:this.props.queries} )
            );
        }
    });

    return Tasks;
});