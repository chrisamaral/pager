/** @jsx React.DOM */
define(['../helpers/utils', './component.DateInput'], function (utils, DateInput) {
    var Tasks,
        TaskInput,
        FilterList,
        FilterItem,
        TxtInput,
        Query,
        QueryInfoDropDown,
        QueryTasks,
        QueryTask,
        filterName = {
            schedule: "Agenda::Ordem",
            task_id: "Código::Ordem",
            creation: "Ingresso::Ordem",
            task_status: "Status::Ordem",
            task_type: "Tipo::Ordem",
            customer_id: "Código::Assinante",
            customer_name: "Nome::Assinante",
            address: "Endereço::Assinante"

        };


    TxtInput = React.createClass({displayName: 'TxtInput',
        render: function () {
            return React.DOM.input( {name:this.props.inputName, required:true, autoComplete:"on", type:"text", defaultValue:"", placeholder:this.props.name}  );
        }
    });

    FilterItem = React.createClass({displayName: 'FilterItem',
        killFilter: function(e){
            e.preventDefault();
            this.props.removeFilter(this.props.key);
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

            $.get('/' + pager.org.id + '/api/console/tasks', parsed)
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
                                {key:index,
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
        killMe: function () {
            this.props.removeTask(this.props.key);
        },
        render: function () {
            return React.DOM.div( {className:"queryTask"}, 
                React.DOM.a( {className:"right radius ico fi-x-circle", title:"Remover", onClick:this.killMe}),
                AttrTable( {key:this.props.key, attrs:this.props.task.attrs} )
            );
        }
    });

    QueryTasks = React.createClass({displayName: 'QueryTasks',

        render: function () {
            var AttrTable = pager.components.AttrTable;
            return React.DOM.div(null, 
                this.props.tasks.map(function (task, index) {
                    return QueryTask( {key:index, task:task, removeTask:this.props.removeTask} );
                }.bind(this))
            );
        }
    });

    Query = React.createClass({displayName: 'Query',
        getInitialState: function(){
            return {
                visibleTasks: true,
                triggedMenu: false,
                auxId: 'q' + Math.random().toString(36).substr(2)
            };
        },
        killMe: function (e) {
            e.preventDefault();
            this.props.popQuery(this.props.key);
        },
        componentDidMount: function () {
            $(this.getDOMNode()).foundation();
            $('#' + this.state.auxId + 'killMe').click(this.killMe);
        },
        componentDidUpdate: function(){
            $(this.getDOMNode()).foundation();
        },
        removeTask: function (index) {
            var tasks = this.props.query.tasks;
            tasks.splice(index, 1);
            this.setTasks(tasks);
        },
        setTasks: function (tasks) {
            var n_query = this.props.query;
            n_query.tasks = tasks;
            this.props.setQuery(n_query, this.props.key);
        },
        toggleTasks: function (e) {
            e.preventDefault();
            this.setState({visibleTasks: !this.state.visibleTasks});
        },
        render: function () {
            var hasTasks = this.props.query.tasks.length > 0,
                tasksClass = React.addons.classSet({'no-flow-x': true, hide: hasTasks && !this.state.visibleTasks});
            return (
                React.DOM.div( {className:"panel queryResult"}, 
                    React.DOM.h5( {className:"clearfix", onClick:this.toggleTasks}, 
                        this.props.query.name ? this.props.query.name : null,
                        React.DOM.a( {'data-options':"is_hover:true", onClick:function(e){e.stopPropagation();}, className:"right radius ico fi-info", title:"Informação", 'data-dropdown':this.state.auxId + 'Info'}),
                        React.DOM.a( {'data-options':"is_hover:true", onClick:function(e){e.stopPropagation();}, className:"right radius ico fi-list", title:"Menu", 'data-dropdown':this.state.auxId + 'Menu'})
                    ),
                    React.DOM.div( {className:tasksClass}, 
                         hasTasks
                            ? QueryTasks( {tasks:this.props.query.tasks, removeTask:this.removeTask} ) : null 
                    ),
                    React.DOM.ul( {id:this.state.auxId + 'Menu', className:"tiny f-dropdown hide", 'data-dropdown-content':true}, 
                        React.DOM.li(null, React.DOM.a( {id:this.state.auxId + 'killMe'}, "Descartar"))
                    ),
                    QueryInfoDropDown(
                        {id:this.state.auxId + 'Info',
                        count:this.props.query.tasks.length,
                        query:this.props.query.query} )
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
        pushQuery: function (query, tasks, callback) {
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
                name: $($type).find('option:selected').text()
            });
            this.setState({filters: filters});
        },
        createTask: function (e) {
            e.preventDefault();
        },
        render: function () {
            return (
                React.DOM.div( {className:"panel content"}, 
                    React.DOM.form( {onSubmit:this.createFilter}, 
                        React.DOM.div( {className:"row"}, 
                            React.DOM.div( {className:"large-12 columns"}, 
                                React.DOM.label(null, "Filtrar por",
                                    React.DOM.select( {name:"type", ref:"filterType"}, 
                                        _.map(filterName, function(name, key){
                                            return React.DOM.option( {key:key, value:key}, name);
                                        })
                                    )
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
                    React.DOM.div( {className:"panel contained"}, 
                        this.props.queries.map(function (query, index) {
                            return Query( {popQuery:this.popQuery, setQuery:this.setQuery, key:index, query:query} );
                        }.bind(this))
                    )
                )
            );
        }
    });

    Tasks = React.createClass({displayName: 'Tasks',
        render: function () {
            return React.DOM.div( {id:"Tasks"}, 
                React.DOM.h4(null, "Ordens livres"),
                TaskInput( 
                    {setQueries:this.props.setQueries,
                    queries:this.props.queries} )
            );
        }
    });

    return Tasks;
});