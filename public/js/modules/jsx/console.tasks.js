/** @jsx React.DOM */
define(['./component.DateInput'], function (DateInput) {
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


    TxtInput = React.createClass({
        render: function () {
            return <input name={this.props.inputName} required={true} autoComplete='on' type='text' defaultValue='' placeholder={this.props.name}  />;
        }
    });

    FilterItem = React.createClass({
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

            return <div className='row'>
                <div className='large-12 columns text-right'>
                    <label>
                        <strong>{this.props.name}
                            <a onClick={this.killFilter}> - </a>
                        </strong>
                        <FilterInput id={this.props.id} name={this.props.name} inputName={this.props.id} />
                    </label>
                </div>
            </div>
        }
    });

    FilterList = React.createClass({
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

            $.get(pager.urls.ajax + 'console/tasks/' + this.props.day, parsed)
                .done(function (tasks) {

                    if (!_.isArray(tasks)) {
                        return;
                    }

                    this.props.pushQuery(parsed, tasks);

                }.bind(this));
        },
        render: function () {
            var fs = this.props.filters.map(function (filter, index) {
                    var _id = Foundation.utils.random_str(10);
                    return <FilterItem
                                key={filter.key}
                                index={index}
                                id={filter.id} name={filter.name}
                                removeFilter={this.props.removeFilter} />;
                }.bind(this));
            return <div className='filter-list panel'>
                <form onSubmit={this.handleSubmit}>
                    {fs}
                    <div className='row'>
                        <div className='large-12 columns text-right'>
                            <button type='submit' className='tiny success button'>Buscar</button>
                        </div>
                    </div>
                </form>
            </div>;
        }
    });
    
    QueryInfoDropDown = React.createClass({
        render: function () {
            return (<div data-dropdown-content className="f-dropdown content medium hide" id={this.props.id}>
                <h4 className='subheader'>{(this.props.count || 'Nenhuma') + (this.props.count > 1 ? ' ordens' : ' ordem')}</h4>
                <table className='queryInfoDropDownTable'>
                    <tbody>
                        {_.map(this.props.query, function (item, key) {
                            return (
                                <tr key={key}>
                                    <td>{filterName[key]}</td>
                                    <td>
                                        {item.map(function(val, index){
                                            return <span key={index} className="round secondary label">{val}</span>;
                                        })}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>);
        }
    });
    QueryTask = React.createClass({
        killMe: function () {
            this.props.removeTask(this.props.index);
            if (this.props.selectedTask === this.props.task._id) {
                this.mapFocusOnMe();
            }
        },
        mapFocusOnMe: function () {
            this.props.setTaskFocus(this.props.task._id);
        },

        render: function () {
            
            var AttrTable = pager.components.AttrTable,
                classes = React.addons.classSet({
                    queryTask: true,
                    selectedTask: this.props.selectedTask === this.props.task._id
                });

            return <div className={classes} data-task={this.props.task._id}>
                <span className='icos'>
                    { this.props.task.location
                        && <a className='radius ico fi-target-two' onClick={this.mapFocusOnMe} title='Selecionar'></a> }
                    <a className='radius ico fi-x' ref='menuBt' title='Descartar' onClick={this.killMe}></a>
                </span>
                <AttrTable attrs={this.props.task.attrs} />
            </div>;

        }
    });
    LookupProgress = React.createClass({

        getInitialState: function () {
            return {
                lookupProgress: null,
                alreadyStartedLookup: false
            };
        },

        startGeoLookup: function (newProps) {

            if (this.state.alreadyStartedLookup) return;

            this.setState({alreadyStartedLookup: true});

            require(['../lib/task.geocoder'], function (Geocoder) {
                var props = newProps || this.props;
                var g = new Geocoder(props.tasks);

                g.onProgress = function (completed, total, currentTask, status) {

                    if (!this.isMounted()) return g.abort();

                    try{

                        this.setState({
                            lookupProgress: total ? Math.floor(100 * completed / total) : null
                        }, function () {
                            if (status !== 'unchanged') props.updateTask(currentTask);
                        }.bind(this));


                    } catch (e) {
                        g.abort();
                        throw e;
                    }

                }.bind(this);

                g.onComplete = function () {
                    setTimeout(function(){
                        this.setState({
                            lookupProgress: null,
                            alreadyStartedLookup: false
                        });
                    }.bind(this), 1000 * 2);

                }.bind(this);

                g.init();
            }.bind(this));

        },
        shouldLookupGeo: function (props) {
            props = props || this.props;
            var noGeo = _.find(props.tasks, function (x) { return !x.location; });
            return noGeo;
        },
        componentWillReceiveProps: function (newProps) {
            if (newProps.hasGoogleMaps && this.shouldLookupGeo(newProps)) {
                this.startGeoLookup(newProps);
            }
        },
        componentDidMount: function () {
            if (this.props.hasGoogleMaps && this.shouldLookupGeo()) {
                this.startGeoLookup();
            }
        },
        render: function () {
            var style = {};
            if (this.state.lookupProgress === null) {
                style.display = 'none';
            }
            return <progress style={style} value={this.state.lookupProgress} max={100} title={this.state.lookupProgress + '% das ordens foram localizadas'} />;
        }
    });

    QueryElem = React.createClass({

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
                    <ul id={this.state.auxId + 'Menu'} className='tiny f-dropdown hide' data-dropdown-content>
                        <li><a id={this.state.auxId + 'routeMe'}>Rotear</a></li>
                        <li><a id={this.state.auxId + 'killMe'}>Descartar</a></li>
                    </ul>)).appendTo('body'),
                info =
                    $(React.renderComponentToString(
                        <QueryInfoDropDown
                                id={this.state.auxId + 'Info'}
                                count={this.props.query.tasks.length}
                                query={this.props.query.query} />)).appendTo('body');

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
        toggleMe: function (e) {
            $(e.currentTarget).parent().children('.QueryElem').toggle();
        },
        render: function () {
            var noPropagation = function(e){e.stopPropagation();};
            return (
                <div className='panel sequential queryResult'>
                    <h5 className='clearfix' onClick={this.toggleMe}>
                        {this.props.query.name ? this.props.query.name : null}
                        <a onClick={noPropagation} className='right radius ico fi-info' title='Informação' data-dropdown={this.state.auxId + 'Info'}></a>
                        <a onClick={noPropagation} className='right radius ico fi-list' title='Menu' data-dropdown={this.state.auxId + 'Menu'}></a>
                    </h5>
                    <LookupProgress updateTask={this.updateTask} tasks={this.props.query.tasks} hasGoogleMaps={this.props.hasGoogleMaps} />
                    <div ref='tasks' className='QueryElem no-flow-x'>
                        {this.props.query.tasks.map(function (task, index) {
                            return <QueryTask key={task._id} index={index} task={task}
                                        setTaskFocus={this.props.setTaskFocus}
                                        selectedTask={this.props.selectedTask}
                                        removeTask={this.removeTask} />;
                        }.bind(this))}
                    </div>
                </div>
            );
        }
    });

    TaskInput = React.createClass({
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
                <div className='TaskInput panel contained'>
                    <form onSubmit={this.createFilter}>
                        <div className='row'>
                            <div className='large-12 columns'>
                                <label>Filtrar por
                                    <select name='type' ref='filterType'>
                                        {_.map(filterName, function(name, key){
                                            return <option key={key} value={key}>{name}</option>;
                                        })}
                                    </select>
                                </label>
                            </div>
                        </div>
                        <div className='row'>
                            <div className='large-12 columns text-right'>
                                <button disabled className='tiny secondary button' onClick={this.createTask}>+ Ordem</button>
                                <button type='submit' className='tiny success button'>+ Filtro</button>
                            </div>
                        </div>
                    </form>
                {this.state.filters.length
                    ? <FilterList removeFilter={this.removeFilter}
                            day={this.props.day}
                            filters={this.state.filters} 
                            pushQuery={this.pushQuery} /> : null }
                    <div className='panel sequential contained'>
                        {this.props.queries.map(function (query, index) {
                            return (
                                <QueryElem
                                    routeThem={this.props.routeThem}
                                    setTaskFocus={this.props.setTaskFocus}
                                    selectedTask={this.props.selectedTask}
                                    hasGoogleMaps={this.props.hasGoogleMaps}
                                    popQuery={this.popQuery}
                                    setQuery={this.setQuery}
                                    key={query.id}
                                    index={index}
                                    query={query} />
                            );
                        }.bind(this))}
                    </div>
                </div>
            );
        }
    });

    Tasks = React.createClass({

        routeThem: function (tasks) {
            this.props.routeTasks(tasks);
        },
        componentDidUpdate: function () {
            $(this.refs.clickToRoute.getDOMNode())
                .off('click', this.routeThemAll)
                .on('click', this.routeThemAll);
        },
        componentDidMount: function () {
            $(this.refs.clickToRoute.getDOMNode())
                .off('click', this.routeThemAll)
                .on('click', this.routeThemAll);
        },
        routeThemAll: function (e) {
            e.stopPropagation();
            e.preventDefault();

            var tasks = [];
            this.props.queries.forEach(function (query) {
                query.tasks.forEach(function (task) {
                    if (!_.any(tasks, {_id: task._id})) {
                        tasks.push(task);
                    }
                });
            });
            this.routeThem(tasks);
            return false;
        },

        render: function () {
            return <div id='Tasks' className='leftMapControl'>
                <div className='controlIco'><i className='fi-calendar'></i></div>
                <div className='controlContent'>
                    <h3 className='controlTitle'>Ordens livres
                        <a ref='clickToRoute' className='right radius ico fi-fast-forward' title='Rotear todos'></a>
                    </h3>
                    <TaskInput
                        routeThem={this.routeThem}
                        locations={this.props.locations}
                        day={this.props.day}
                        setTaskFocus={this.props.setTaskFocus}
                        selectedTask={this.props.selectedTask}
                        hasGoogleMaps={this.props.hasGoogleMaps}
                        setQueries={this.props.setQueries}
                        queries={this.props.queries} />
                </div>
            </div>;
        }
    });

    return Tasks;
});