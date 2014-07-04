/** @jsx React.DOM */
define([
    '../ext/aviator/main',
    './component.DateInput',
    './console.queue',
    './console.tasks',
    './console.map',
    './console.schedule',
    '../helpers/utils.js',
    '../ext/strftime'
],
function (Aviator, DateInput, Queue, Tasks, Map, Schedule, utils, strftime) {
    var ConsoleOpts,
        LeftPanel,
        RouterController,
        RouterWorkers,
        RouterWorker,
        RouterCfg,
        RightPanel,
        Console,
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
            if (!this.props.worker.tasks.length) return;
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
                
                if (!(worker._id === id && worker.drawDirections())) {

                    worker._id !== id && worker.cleanDirections();
                    worker._id === id && this.props.toggleRouterMode(null);
                    return;

                }

                this.props.toggleRouterMode(
                    worker._id, worker.tasks.map(
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
                workers: [],
                day: this.props.router._day
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

            this.props.router.fail(function () {
                if (!this.isMounted()) return;

                this.props.cancelRoute();
            }.bind(this));

        },
        cancel: function () {
            this.state.workers.forEach(function (worker) {
                worker.cleanDirections();
            });
            this.props.cancelRoute();
        },
        save: function () {
            this.state.workers.forEach(function (worker) {
                worker.cleanDirections();
            });
            this.props.saveRoute(this.state.workers, this.state.day);
        },
        render: function () {
            return React.DOM.div( {id:"Router", className:"leftMapControl"}, 
                React.DOM.div( {className:"controlIco"}, React.DOM.i( {className:"fi-page-multiple"})),
                React.DOM.div( {className:"controlContent"}, 
                    React.DOM.h4(null, "Roteador"),
                    React.DOM.div( {className:"panel contained clearfix"}, 
                        
                         !this.state.workers.length &&
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

    ConsoleOpts = React.createClass({displayName: 'ConsoleOpts',
        handleSubmit: function (e) {
            e.preventDefault();
            
            var s = {day: this.refs.dayInput.getDOMNode().value, 
                        org: pager.org.id, locations: this.props.locations};

            Aviator.navigate('/:org/console/:day/:locations', {namedParams: s});
        },
        render: function () {
            return (
                React.DOM.div( {id:"ConsoleOpts", className:"leftMapControl"}, 
                    React.DOM.div( {className:"controlIco"}, 
                        React.DOM.i( {className:"fi-widget"})
                    ),
                    React.DOM.div( {className:"controlContent"}, 
                        React.DOM.h4(null, "Opções da agenda"),
                        React.DOM.div( {className:"panel contained"}, 
                            React.DOM.form( {onSubmit:this.handleSubmit}, 
                                React.DOM.div( {className:"row"}, 
                                    React.DOM.div( {className:"large-12 columns"}, 
                                        React.DOM.label(null, "Dia",
                                            DateInput( {ref:"dayInput", date:this.props.day, inputName:"day"} )
                                        )
                                    )
                                ),
                                React.DOM.div( {className:"row"}, 
                                    React.DOM.div( {className:"large-12 columns text-right"}, 
                                        React.DOM.button( {className:"tiny success button"}, "Ok")
                                    )
                                )
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
                    
                    ConsoleOpts( {day:this.props.day, locations:this.props.locations} ),

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
    
    function emptyA(A){
        while(A.length > 0) A.pop();
    }

    RightPanel = React.createClass({displayName: 'RightPanel',
        componentDidMount: function () {
            
            var handler = _.throttle(
                function () {
                    
                    if (!this.isMounted()) return $('#ScrollRoot').off('resize', handler);
                    
                    this.forceUpdate();

                }.bind(this),
            100);

            $('#ScrollRoot').on('resize', handler);

        },
        render: function () {
            var myWidth = $('#Console').width() - $('#LeftPanel').width();

            return React.DOM.main( {id:"RightPanel", style:{width: myWidth}}, 
                 this.props.schedule.length 
                    ?  Schedule( {width:myWidth, schedule:this.props.schedule} ) : null, 
                this.props.routerLoader &&
                    React.DOM.div(null, 
                        React.DOM.h4(null, "Configurações de Roteamento"),
                        React.DOM.div( {className:"panel"}, 
                            RouterCfg( {day:this.props.routerLoader._day, onSet:this.props.routerLoader} )
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

            var dayHasChanged = newProps.args.day !== this.state.day;

            this.setState(this.parseArgsToState(newProps), function () {


                if (dayHasChanged) {
                    emptyA(newProps.lib.data.schedule);
                    this.updateSchedule();
                }

                this.updateDefaultQuery(dayHasChanged);
                
            }.bind(this));

        },
        
        offCanvasMenuOpen: function () {
            $('#ScrollRoot').scrollTop(0).css('overflow-y', 'scroll');
            $('#appContainer').css('overflow-y', 'hidden');
        },
        offCanvasMenuClose: function () {
            $('#ScrollRoot, #appContainer').css('overflow-y', '');
        },

        componentDidMount: function () {
            this.updateDefaultQuery(true);
            this.putArgs();

            
            var onResize = _.throttle(function () {
                
                if(!this.isMounted) return $(window).off('resize', onResize);
                this.forceUpdate();

                //$('#ScrollRoot').trigger('resize');

            }.bind(this), 300);

            $(window).on('resize', onResize);

            this.componentWillUnmount.__interval = setInterval(this.updateSchedule, 
                pager.constant.console.WHOLE_SCHEDULE_UPDATE_INTERVAL);
            this.updateSchedule();

            $(document).on('open.fndtn.offcanvas', '[data-offcanvas]', this.offCanvasMenuOpen);
            $(document).on('close.fndtn.offcanvas', '[data-offcanvas]', this.offCanvasMenuClose);

        },

        updateSchedule: function () {
            
            if (!this.isMounted()) return;

            $.get(pager.urls.ajax + 'console/schedule/' + this.state.day)
                .done(function (result) {
                    if (!this.isMounted()) return;
                    this.props.lib.set('schedule', result);
                }.bind(this));
        },

        componentWillUnmount: function () {
            clearInterval(this.componentWillUnmount.__interval);

            $(document).off('open.fndtn.offcanvas', '[data-offcanvas]', this.offCanvasMenuOpen);
            $(document).off('close.fndtn.offcanvas', '[data-offcanvas]', this.offCanvasMenuClose);
        },
        
        putArgs: function () {
            var pieces = [pager.org.id, 'console', this.state.day, this.state.locations], uri;

            
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

            if (this.props.lib.state.selectedTask === taskId 
                    && this.props.lib.state.mapState === pager.constant.console.map.SELECTED_TASK) {
                this.props.lib.state.selectedTask = null;
                this.props.lib.state.mapState = pager.constant.console.map.AVAILABLE_TASKS;
                return this.props.lib.put();
            }

            this.props.lib.state.mapState = pager.constant.console.map.SELECTED_TASK;
            this.props.lib.state.selectedTask = taskId;
            this.props.lib.put();
        },

        setMapState: function (state) {
            this.props.lib.state.mapState = state;

            if (state !== pager.constant.console.map.SELECTED_TASK) {
                this.props.lib.state.selectedTask = undefined;
            }

            this.props.lib.put();
        },

        toggleRouterMode: function (worker, tasks) {

            if (!worker) {
                this.props.lib.state.mapState = pager.constant.console.map.AVAILABLE_TASKS;
                this.props.lib.state.routerWorker = null;
            } else {
                this.props.lib.state.mapState = pager.constant.console.map.ROUTER_PROJECTION;
                this.props.lib.state.routerWorker = {wayPoints: tasks};
            }

            this.props.lib.put();
        },

        killRoute: function () {
            if (this.props.lib.state.mapState === pager.constant.console.map.ROUTER_PROJECTION) {
                this.props.lib.state.mapState = pager.constant.console.map.AVAILABLE_TASKS;
                this.props.lib.state.routerWorker = null;
            }

            this.props.lib.router.stopRouter();
            delete this.props.lib.router;
            this.props.lib.put();
        },

        saveRoute: function (workers, day) {
            
            function mountTask (task) {
                
                var new_t = {
                    address: task.address,
                    location: task.location,
                    directions: task.directions,
                    duration: task.duration,
                    schedule: task.schedule
                };

                task.ref && task.target && (new_t[task.ref] = task.target);
                
                new_t.tasks = _.map(task.tasks, function (t) {
                    return {
                        task: t._id,
                        attrs: t.attrs,
                        type: t.type
                    };
                });

                return new_t;
            }

            function mountWorker (worker) {
                            
                var new_w = {
                        worker: worker._id,
                        name: worker.name,
                        workShift: worker.workShift,
                        tasks: _.map(worker.tasks, mountTask)
                    };

                worker.startPoint && (new_w.startPoint = worker.startPoint);
                worker.endPoint && (new_w.endPoint = worker.endPoint);

                return new_w;
            }

            var ws = _.map(workers, mountWorker);
            
            $.ajax({
                type: 'POST',
                url: pager.urls.ajax + 'console/schedule/' + day,
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(ws)
            });

            this.updateSchedule();
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

                RightPanel( {router:this.props.lib.router,
                    schedule:this.props.lib.data.schedule,
                    day:this.state.day,
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
            mapState: pager.constant.console.map.AVAILABLE_TASKS
        };

        this.rootComponent = null;
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
        }

        this.rootComponent.setProps({lib: this});

    };

    Lib.prototype.set = function (collection, items) {

        if (collection === 'queries') {

            items = items.filter(function(item, index){
                return item.name === 'Agenda' || item.tasks;
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

            me.routerLoader = function (workers) {
                delete me.routerLoader;

                if (workers && workers.length) {
                    me.router = new Router(day, tasks, workers);
                    me.router._day = day;
                }

                me.put();
            };
            
            me.routerLoader._day = day;
            me.put();
        });
    };

    Lib.prototype.setDefaultQuery = function (day, dayHasChanged) {

        //if (pager.isDev) return;

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
            schedule: []
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

        }

        this.fetchQueries();
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