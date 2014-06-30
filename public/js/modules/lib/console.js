/** @jsx React.DOM */
define([
    '../ext/aviator/main',
    './console.queue',
    './console.tasks',
    './console.map',
    '../helpers/utils.js',
    '../ext/strftime'
],
function (Aviator, Queue, Tasks, Map, utils, strftime) {
    var LeftPanel,
        RouterController,
        RouterWorkers,
        RouterWorker,
        RouterCfg,
        RightPanel,
        Console,
        onResize,
        UserLink,
        AttrTable,
        AttrItem,
        ObjectLink,
        Librarian;

    LazyLoad.css(['/css/console.css']);

    function locTranslate (loc) {

        if (!loc) return '';
        if (_.isString(loc)) return loc;
        if (_.isArray(loc)) return loc.join(',');
        return '';
    }

    UserLink = React.createClass({displayName: 'UserLink',
        render: function () {
            if (this.props.user.url) {
                return React.DOM.a( {target:"_blank", title:this.props.user.full_name, href:this.props.user.url}, 
                    this.props.user.short_name
                );
            }
            return React.DOM.strong( {title:this.props.user.full_name}, this.props.user.short_name);
        }
    });

    ObjectLink = React.createClass({displayName: 'ObjectLink',
        render: function () {
            return React.DOM.span(null, 
                this.props.object.adj ? ' ' + this.props.object.adj : null,
                React.DOM.span(null,  " " ),
                this.props.object.url
                    ? React.DOM.a( {target:"_blank", href:this.props.object.url}, this.props.object.name)
                    : React.DOM.strong(null, this.props.object.name)
            );
        }
    });

    AttrItem = React.createClass({displayName: 'AttrItem',
        toggleTb: function() {
            $(this.getDOMNode()).closest('table').find('tbody>tr').not('.main-attr').toggle();
        },
        render: function () {
            var attr = this.props.attr,
                classes = React.addons.classSet({
                    'main-attr': attr.relevance === 3,
                    'important-attr': attr.relevance === 2
                }),
                val = attr.relevance === 3 && _.isString(attr.value)
                    ? attr.value.toUpperCase()
                    : attr.value,
                hasDescr = attr.relevance !== 3 && attr.descr;
            return React.DOM.tr( {className:classes, onClick:attr.relevance === 3 ? this.toggleTb : null }, 
                hasDescr ? React.DOM.td(null, attr.descr) : null,
                React.DOM.td( {colSpan:attr.relevance === 3 || !hasDescr ? 2 : 1, title:!hasDescr && attr.descr ? attr.descr : ''}, 
                    attr.url
                        ? React.DOM.a( {href:attr.url, target:"_blank"}, val)
                        : val
                        
                )
            );
        }
    });

    AttrTable = React.createClass({displayName: 'AttrTable',
        render: function () {
            var attrs = _.filter(this.props.attrs, {relevance: 3})
                .concat(_.filter(this.props.attrs, {relevance: 2}))
                .concat(_.filter(this.props.attrs, function(attr){
                    return !attr.relevance || attr.relevance <= 1;
                }));
            return React.DOM.table( {className:"attr-table"}, 
                React.DOM.tbody(null, 
                        attrs.map(function(attr, index){
                            return AttrItem(
                            {key:index,
                            attr:attr} );
                        })
                )
            );
        }
    });

    RouterWorker = React.createClass({displayName: 'RouterWorker',
        drawMe: function () {
            this.props.drawWorkerDirections(this.props.worker._id);
        },
        render: function () {
            return React.DOM.li( {key:this.props.worker._id}, 
                React.DOM.a( {onClick:this.drawMe}, this.props.worker.name)
            )
        }
    });

    RouterWorkers = React.createClass({displayName: 'RouterWorkers',
        drawWorkerDirections: function (id) {

            this.props.workers.forEach(function (worker) {
                if (worker._id === id && worker.drawDirections()) {

                    this.props.toggleRouterMode(worker._id,
                        worker.tasks.map(
                            function (task) {

                                if (!task.schedule) return;

                                var attrs = [
                                    {relevance: 3, value: worker.name},
                                    {descr: 'Tipos', value: _.uniq(task.types).join(', ')},
                                    {
                                        descr: 'Deslocamento',
                                        value: strftime('%H:%M', task.directions.schedule.ini) + ' < ' +
                                            task.directions.duration.text + ' - ' + task.directions.distance.text +
                                            ' > ' + strftime('%H:%M', task.directions.schedule.end)
                                    },
                                    {
                                        descr: 'Execução',
                                        value: strftime('%H:%M', task.schedule.ini) + ' < ' +
                                                 Math.floor(task.duration/1000/60) + 'min' + ' > ' +
                                                    strftime('%H:%M', task.schedule.end)
                                    },
                                    {descr: 'Duração', value: Math.floor(task.duration/1000/60) + 'min'}
                                ], ids = _.map(task.tasks, '_id');

                                if (task.schedule.from && task.schedule.to) {
                                    !_.isDate(task.schedule.from) && (task.schedule.from = new Date(task.schedule.from));
                                    !_.isDate(task.schedule.to) && (task.schedule.to = new Date(task.schedule.to));

                                    attrs.push({descr: 'Agenda', value: strftime('%d/%m/%Y', task.schedule.from)});

                                    attrs.push({
                                        descr: 'Turno',
                                        value: strftime('%H:%M', task.schedule.from)
                                            + ' <> ' + strftime('%H:%M', task.schedule.to)
                                    });
                                }

                                ids.length && attrs.push({descr: 'ID', value: ids.join(', ')});

                                if (task.target) {
                                    attrs.push({descr: 'Cliente', value: task.target.name, relevance: 2});
                                }

                                attrs.push({value: task.address.address});
                                return {
                                    id: 'wRTask-' + task.id,
                                    worker: worker.name,
                                    location: task.location,
                                    attrs: attrs
                                };
                            }
                        )
                    );

                } else {
                    worker._id !== id && worker.cleanDirections();
                    worker._id === id && this.props.toggleRouterMode(null);
                }
            }.bind(this));

        },

        render: function () {
            return React.DOM.div( {id:"RouterWorkers"}, 
                React.DOM.ul(null, 
                    this.props.workers.map(function (worker) {
                        return RouterWorker( {drawWorkerDirections:this.drawWorkerDirections, key:worker._id, worker:worker} );
                    }.bind(this))
                )
            );
        }
    });

    RouterController = React.createClass({displayName: 'RouterController',
        getInitialState: function () {
            return {
                messages: [],
                workers: []
            };
        },

        componentDidMount: function() {
            this.props.router.progress(function (type, data) {
                if (!this.isMounted()) return;

                switch (type) {
                    case 'message':
                        this.state.messages.push(data);
                        this.setState({messages: this.state.messages});
                        break;
                }
            }.bind(this));

            this.props.router.done(function (workers) {
                if (!this.isMounted()) return;

                this.setState({workers: workers});
            }.bind(this));

        },
        cancel: function () {
            this.state.workers.forEach(function(worker){
                worker.cleanDirections();
            });
            this.props.cancelRoute();
        },
        save: function () {
            this.state.workers.forEach(function(worker){
                worker.cleanDirections();
            });
            this.props.saveRoute(this.state.workers);
        },
        render: function () {
            return React.DOM.div( {id:"Router", className:"leftMapControl"}, 
                React.DOM.div( {className:"controlIco"}, React.DOM.i( {className:"fi-page-multiple"})),
                React.DOM.div( {className:"controlContent"}, 
                    React.DOM.h4(null, "Roteador"),
                    React.DOM.div( {className:"panel contained clearfix"}, 
                        React.DOM.div( {id:"RouterLog"}, 
                            this.state.messages.map(function (msg, index) {
                                return React.DOM.p( {key:index}, msg);
                            })
                        ),
                        RouterWorkers( {workers:this.state.workers, toggleRouterMode:this.props.toggleRouterMode} ),
                        React.DOM.div( {className:"row"}, 
                            React.DOM.div( {className:"text-right"}, 
                                React.DOM.button( {onClick:this.cancel, className:"tiny alert button"}, "Cancelar"),
                                this.state.workers && this.state.workers.length
                                    ? React.DOM.button( {onClick:this.save, className:"tiny success button"}, "Salvar")
                                    : null
                            )
                        )
                    )
                )
            );
        }
    });

    LeftPanel = React.createClass({displayName: 'LeftPanel',
        componentDidMount: function () {
            function toggleControl () {
                $(this).closest('.leftMapControl').children('.controlContent,.controlIco').toggle();
                $('#ScrollRoot').trigger('resize');
            }
            $(this.getDOMNode()).on('click', '.controlContent>h4,.controlIco', toggleControl);
        },
        render: function () {
            return React.DOM.nav( {id:"LeftPanel"}, 
                React.DOM.div( {id:"LeftPanelWrapper"}, 

                     this.props.pending.length
                            ? Queue( {items:this.props.pending,
                                    locations:this.props.locations} ) : null, 
                     this.props.router &&
                        RouterController( {router:this.props.router,
                                saveRoute:this.props.saveRoute,
                                cancelRoute:this.props.cancelRoute,
                                toggleRouterMode:this.props.toggleRouterMode} ), 
                    Tasks( {routeTasks:this.props.routeTasks,
                        locations:this.props.locations,
                        day:this.props.day,
                        setTaskFocus:this.props.setTaskFocus,
                        selectedTask:this.props.selectedTask,
                        hasGoogleMaps:this.props.hasGoogleMaps,
                        queries:this.props.queries,
                        setQueries:this.props.setQueries} )
                )
            );
        }
    });

    RightPanel = React.createClass({displayName: 'RightPanel',
        componentDidMount: function () {
            $('#ScrollRoot').on('resize', _.throttle(function(){
                this.forceUpdate();
            }.bind(this), 100));
        },
        render: function () {
            return React.DOM.main( {id:"RightPanel", style:{width: $('#Console').width() - $('#LeftPanel').width()}}, 
                this.props.routerLoader &&
                    React.DOM.div(null, 
                        React.DOM.h4(null, "Configurações de Roteamento"),
                        React.DOM.div( {className:"panel"}, 
                            RouterCfg( {workers:
                                    _.map(this.props.workers,
                                        function (worker) {
                                            return {
                                                _id: worker._id,
                                                name: worker.name,
                                                types: worker.types
                                            };
                                        }
                                    ),
                                 onSet:this.props.routerLoader} )
                        )
                    )
                
            );
        }
    });

    Console = React.createClass({displayName: 'Console',
        parseArgsToState: function (props) {
            props = props || this.props;
            return {
                day: props.args.day ? props.args.day : (new Date).toYMD(),
                locations: locTranslate(
                    props.args.locations
                        ? props.args.locations
                        : []
                )
            };
        },

        getInitialState: function () {
            return this.parseArgsToState();
        },

        componentWillReceiveProps: function (newProps) {
            var dayHasChanged = this.props.args.day !== this.state.day;
            this.setState(this.parseArgsToState(newProps), function () {
                this.updateDefaultQuery(dayHasChanged);
            }.bind(this));
        },

        componentDidMount: function () {
            this.updateDefaultQuery(true);
            this.putArgs();

            onResize = _.throttle(function () {
                this.forceUpdate();
            }.bind(this), 300);

            $(window).resize(onResize);
        },

        componentWillUnmount: function () {
            $(window).off('resize', onResize);
        },

        putArgs: function () {
            var pieces = [pager.org.id, 'console', this.state.day], uri;

            if (this.state.locations.length) {
                pieces.push(this.state.locations);
            }
            uri = '/' + pieces.join('/');
            if (uri !== Aviator.getCurrentURI()) {
                Aviator.navigate(uri);
            }
        },

        updateDefaultQuery: function (dayHasChanged) {
            this.props.lib.setDefaultQuery(this.state.day, dayHasChanged);
        },

        setQueries: function (items) {
            this.props.lib.set('queries', items);
        },

        setTaskFocus: function (taskId) {

            if (this.props.lib.state.selectedTask === taskId && this.props.lib.state.mapState === 'task') {
                this.props.lib.state.selectedTask = null;
                this.props.lib.state.mapState = 'tasks';
                return this.props.lib.put();
            }

            this.props.lib.state.mapState = 'task';
            this.props.lib.state.selectedTask = taskId;
            this.props.lib.put();
        },

        setMapState: function (state) {
            this.props.lib.state.mapState = state;

            if (state !== 'task') {
                this.props.lib.state.selectedTask = undefined;
            }

            this.props.lib.put();
        },

        toggleRouterMode: function (worker, tasks) {

            if (!worker) {
                this.props.lib.state.mapState = 'tasks';
                this.props.lib.state.routerWorker = null;
            } else {
                this.props.lib.state.mapState = 'router';
                this.props.lib.state.routerWorker = {wayPoints: tasks};
            }

            this.props.lib.put();
        },

        killRoute: function () {
            if (this.props.lib.state.mapState === 'router') {
                this.props.lib.state.mapState = 'tasks';
                this.props.lib.state.routerWorker = null;
            }

            this.props.lib.router.stopRouter();
            delete this.props.lib.router;
            this.props.lib.put();
        },

        saveRoute: function (workers) {
            console.log(workers);
            this.killRoute();
        },

        cancelRoute: function () {
            this.killRoute();
        },

        initRouter: function (tasks) {
            this.props.lib.startRouter(this.state.day, tasks, this);
        },

        render: function () {
            var h = $(window).height() - $('.tab-bar').outerHeight(), style = {'min-height': h};

            return React.DOM.div( {id:"Console", style:style}, 
                 this.props.lib.state.hasGoogleMaps
                    ? Map( {queries:this.props.lib.data.queries,
                            setTaskFocus:this.setTaskFocus,
                            routerWorker:this.props.lib.state.routerWorker,
                            mapState:this.props.lib.state.mapState,
                            height:h,
                            setMapState:this.setMapState,
                            selectedTask:this.props.lib.state.selectedTask} )
                    : null,
                
                LeftPanel( {pending:this.props.lib.data.pending,
                    routeTasks:this.initRouter,
                    queries:this.props.lib.data.queries,
                    toggleRouterMode:this.toggleRouterMode,
                    saveRoute:this.saveRoute,
                    cancelRoute:this.cancelRoute,
                    day:this.state.day,
                    router:this.props.lib.router,
                    locations:this.state.locations,
                    hasGoogleMaps:this.props.lib.state.hasGoogleMaps,
                    setQueries:this.setQueries,
                    selectedTask:this.props.lib.state.selectedTask,
                    setTaskFocus:this.setTaskFocus} ),

                RightPanel( {workers:this.props.lib.data.workers,
                    router:this.props.lib.router,
                    totalWidth:$(window).width(),
                    routerLoader:this.props.lib.routerLoader,
                    hasGoogleMaps:this.props.lib.state.hasGoogleMaps} )
            );
        }

    });

    function Lib(){
        this.data = {};

        this.state = {
            hasGoogleMaps: false,
            mapState: 'tasks'
        };

        this.rootComponent = null;

        /* mapStates:
            tasks > mostrar todas ordens pendentes => ao clicar em uma: abre `task`
            task > mostra apenas uma ordem, incluindo
                    informações que ajudem o operador a tomar alguma decisão,
                    exemplo: qual técnico está mais próximo
            workers > mostrar posição de todos técnicos
        */
    }

    Lib.prototype.put = function () {
        if (Modernizr.localstorage) {
            localStorage.setItem('pager.' + pager.org.id + '.console.queries',
                JSON.stringify(this.data.queries.filter(function (query) {
                        return query.name !== 'Agenda';
                    }).map(function (query) {
                        query = _.clone(query);
                        query.tasks = [];
                        return query;
                    })
                )
            );
            localStorage.setItem('pager.' + pager.org.id + '.console.workers', JSON.stringify(this.data.workers));
        }

        this.rootComponent.setProps({lib: this});

    };

    Lib.prototype.set = function (collection, items) {

        if (collection === 'queries') {

            items = items.filter(function(item, index){
                return item.name === 'Agenda' || (item.tasks && item.tasks.length);
            }).map(function(item){
                item.id = item.id || 'query-' + Math.random().toString(36).substr(2);
                return item;
            });
        }

        this.data[collection] = items;
        this.put();
    };

    Lib.prototype.loadMaps = function () {
        console.log('loading google maps...');
        var that = this,
            rnd = Math.random().toString(36).substr(2),
            callback = function () {
                _.delay(function () {
                    console.log('done loading google maps');
                    if (window['Pager_' + rnd]) {
                        delete window['Pager_' + rnd];
                    }

                    that.state.hasGoogleMaps = true;
                    that.put();
                }, 500);
            };

        if (typeof google !== 'undefined' && google.maps) {
            return setTimeout(callback, 500);
        }

        utils.loadAPIKeys(function (keys) {
            window['Pager_' + rnd] = callback;

            LazyLoad.js(['https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=true&key=' + keys.google +
                '&libraries=geometry&callback=Pager_' + rnd]);

        }.bind(this));

    };

    Lib.prototype.startRouter = function (day, tasks, Console) {

        if (this.router) {
            return;
        }

        if (!Modernizr.webworkers) {
            alert('Este navegador não suporta as tecnologias necessárias para utilização do roteador. '+
                'Por favor, atualize seu browser e tente novamente.');
        }

        var me = this;

        require(['../lib/router', './console.router.cfg'], function (Router, RCfg) {

            RouterCfg = RCfg;

            if (!Console.isMounted()) return;

            me.routerLoader =  function (workers) {
                delete me.routerLoader;

                if (workers && workers.length) {
                    me.router = new Router(day, tasks, workers);
                }

                me.put();
            };

            me.put();
        });
    };

    Lib.prototype.setDefaultQuery = function (day, dayHasChanged) {

        if (pager.isDev) {
            return;
        }

        var d = {
                id: 'query-' + Math.random().toString(36).substr(2),
                name: 'Agenda',
                tasks: [],
                query: {
                    schedule: [day]
                }
            },
            index = _.findIndex(this.data.queries, {name: 'Agenda'});

        if (index >= 0) {
            if (this.data.queries[index].query.schedule[0] === d.query.schedule[0]) {
                return;
            }
            this.data.queries[index] = d;
        } else {
            if (!dayHasChanged) {
                return;
            }
            this.data.queries.unshift(d);
        }

        console.log('update day', day);

        this.put();
        this.fetchQueries();
    };

    Lib.prototype.fetchQueries = function () {
        this.data.queries.forEach(function (query, index) {
            $.get(pager.urls.ajax + 'console/tasks', query.query)
                .done(function (tasks) {
                    if (!_.isArray(tasks)) {
                        return;
                    }
                    query.tasks = tasks;
                    this.put();

                }.bind(this));
        }.bind(this));
    };

    Lib.prototype.fetchWorkers = function () {
        $.get(pager.urls.ajax + 'console/workers')
            .done(function (workers) {
                this.set('workers', workers);
            }.bind(this));
    };

    Lib.prototype.fetchPendingOrders = function () {
        $.get('/json/console.pending.json')
            .done(function (result) {
                if (_.isString(result)) {
                    try {
                        result = JSON.parse(result);
                    } catch (e) {
                        console.log(e);
                        result = [];
                    }
                }
                this.data.pending = result;
                this.put();
            }.bind(this));
    };

    Lib.prototype.init = function (rootElem, callback) {
        var aux;
        this.data = {
            pending: [],
            queries: [],
            workers: []
        };

        if (Modernizr.localstorage) {
            try{
                aux = JSON.parse(localStorage.getItem('pager.' + pager.org.id + '.console.queries'));
            } catch (xxx) {
                console.log(xxx);
            }

            this.data.queries = aux && aux.length
                ? this.data.queries.concat(aux)
                : this.data.queries;

            try {
                this.data.workers = JSON.parse(localStorage.getItem('pager.' + pager.org.id + '.console.workers'));
            } catch (xxx) {
                console.log(xxx);
            }

        }

        this.fetchQueries();
        this.fetchWorkers();
        this.rootComponent = rootElem;

        callback(this);

        this.fetchPendingOrders();
        this.loadMaps();
    };

    _.merge(pager.components, {UserLink: UserLink, ObjectLink: ObjectLink, AttrTable: AttrTable});

    Librarian = new Lib();
    pager.console = Librarian;

    return {
        component: Console,
        librarian: Librarian
    };
});