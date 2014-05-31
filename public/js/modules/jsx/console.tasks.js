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


    TxtInput = React.createClass({
        render: function () {
            return <input name={this.props.inputName} required={true} autoComplete='on' type='text' defaultValue='' placeholder={this.props.name}  />;
        }
    });

    FilterItem = React.createClass({
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
                    return <FilterItem
                                key={index}
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
            this.props.removeTask(this.props.key);
        },
        render: function () {
            return <div className='queryTask'>
                <a className='right radius ico fi-x-circle' title='Remover' onClick={this.killMe}></a>
                <AttrTable key={this.props.key} attrs={this.props.task.attrs} />
            </div>;
        }
    });

    QueryTasks = React.createClass({

        render: function () {
            var AttrTable = pager.components.AttrTable;
            return <div>
                {this.props.tasks.map(function (task, index) {
                    return <QueryTask key={index} task={task} removeTask={this.props.removeTask} />;
                }.bind(this))}
            </div>;
        }
    });

    Query = React.createClass({
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
                <div className='panel queryResult'>
                    <h5 className='clearfix' onClick={this.toggleTasks}>
                        {this.props.query.name ? this.props.query.name : null}
                        <a data-options='is_hover:true' onClick={function(e){e.stopPropagation();}} className='right radius ico fi-info' title='Informação' data-dropdown={this.state.auxId + 'Info'}></a>
                        <a data-options='is_hover:true' onClick={function(e){e.stopPropagation();}} className='right radius ico fi-list' title='Menu' data-dropdown={this.state.auxId + 'Menu'}></a>
                    </h5>
                    <div className={tasksClass}>
                        { hasTasks
                            ? <QueryTasks tasks={this.props.query.tasks} removeTask={this.removeTask} /> : null }
                    </div>
                    <ul id={this.state.auxId + 'Menu'} className='tiny f-dropdown hide' data-dropdown-content>
                        <li><a id={this.state.auxId + 'killMe'}>Descartar</a></li>
                    </ul>
                    <QueryInfoDropDown
                        id={this.state.auxId + 'Info'}
                        count={this.props.query.tasks.length}
                        query={this.props.query.query} />
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
                <div className='panel content'>
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
                            filters={this.state.filters} 
                            pushQuery={this.pushQuery} /> : null }
                    <div className='panel contained'>
                        {this.props.queries.map(function (query, index) {
                            return <Query popQuery={this.popQuery} setQuery={this.setQuery} key={index} query={query} />;
                        }.bind(this))}
                    </div>
                </div>
            );
        }
    });

    Tasks = React.createClass({
        render: function () {
            return <div id='Tasks'>
                <h4>Ordens livres</h4>
                <TaskInput 
                    setQueries={this.props.setQueries}
                    queries={this.props.queries} />
            </div>;
        }
    });

    return Tasks;
});