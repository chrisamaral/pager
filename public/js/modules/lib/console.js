/** @jsx React.DOM */

define([
    './component.DateInput',
    './console.queue',
    './console.tasks',
    './console.map',
    './console.schedule',
    '../helpers/utils.js',
    '../ext/strftime',
    '../lib/console.component.schedule.js',
    '../lib/console.component.router.js',
    '../lib/console.component.map.js',
    '../lib/console.component.queries.js'
],
function (DateInput, Queue, Tasks, Map, Schedule, utils, strftime, cCompS, cCompR, cCompM, cCompQ) {
    var Aviator = pager.Aviator,
        ConsoleOpts,
        LeftPanel,
        RouterController,
        RouterWorkers,
        RouterWorker,
        RightPanel,
        RightPanelToolbar,
        Console,
        UserLink,
        AttrTable,
        AttrItem,
        ObjectLink;

    LazyLoad.css(['/css/console.css']);

    function emptyA(A){
        while(A.length > 0) A.pop();
    }

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
                            React.DOM.div( {className:"small-12 columns text-right"}, 
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
                $('#Console').trigger('resize');
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

    RightPanelToolbar = React.createClass({displayName: 'RightPanelToolbar',

        getInitialState: function () {
            return {CSVDataURI: null};
        },

        componentDidMount: function () {
            $(this.getDOMNode()).foundation();
            $(this.refs.cleanEmAll.getDOMNode()).on('click', this.props.emptySchedule);
        },

        exportToCSV: function () {

            function getTimeString (val) {
                var d = _.isDate(val)
                            ? val
                            : new Date(val);

                return d.toLocaleString();
            }

            function escapeCSVCell (str){

                if (!_.isString(str)) str = '' + str;

                str = str.replace(/"/g, '""');

                return (str.search(/("|,|\n)/g) >= 0)
                    ? '"' + str + '"'
                    : str;
            }
            var csvText, schedules, blob;

            csvText = [
                "Início estimado",
                "Fim estimado",
                "Encarregado",
                "Tipo Ordem",
                "Referência",
                "Referência:::Tipo",
                "Referência:::ID",
                "Deslocamento",
                "Endereço"].map(escapeCSVCell).join(",") + "\n";

            schedules = _.flatten(_.map(this.props.schedule, function (schedule) {
                    return _.map(schedule.tasks, function (task) {
                        return _.merge({worker: schedule.worker}, task);
                    });
                }));

            schedules.forEach(function (schedule, index) {
                var tmp = [];

                tmp.push(getTimeString(schedule.schedule.ini));
                tmp.push(getTimeString(schedule.schedule.end));

                tmp.push(schedule.worker.name);

                tmp.push(_.uniq(schedule.work_orders.map(function (t) {
                    return t.type;
                })).join(", "));

                schedule.target && schedule.target.name
                    ? tmp.push(schedule.target.name)
                    : tmp.push('---');

                schedule.target && schedule.target.type
                    ? tmp.push(schedule.target.type)
                    : tmp.push('---');

                schedule.target && schedule.target.sys_id
                    ? tmp.push(schedule.target.sys_id)
                    : tmp.push('---');

                (schedule.directions)
                    ? tmp.push(schedule.directions.distance.text + " | " + schedule.directions.duration.text)
                    : tmp.push('---');

                tmp.push(schedule.address.address);

                tmp = tmp.map(escapeCSVCell).join(",");

                csvText += index < schedules.length ? tmp + "\n" : tmp;
            });

            blob = new Blob([csvText], {type: 'text/csv'});
            this.setState({CSVDataURI: URL.createObjectURL(blob)});
        },
        cleanCSV: function () {
            this.setState({CSVDataURI: null});
        },

        render: function () {
            return React.DOM.div( {id:"RightPanelToolbar"}, 
                React.DOM.div( {className:"row"}, 
                    React.DOM.div( {className:"small-12 columns"}, 
                        this.state.CSVDataURI

                            ? React.DOM.a( {className:"button success small", href:this.state.CSVDataURI,
                                download:'Extração-Pager-' + (new Date()).toLocaleString() + '.csv',
                                onClick:this.cleanCSV}, "Baixar")

                            : React.DOM.button( {className:"button secondary small", onClick:this.exportToCSV}, "Exportar"),
                        
                        React.DOM.a( {'data-dropdown':"RightPanelToolbarDropDown", className:"button secondary small dropdown"}, "Opções")
                    )
                ),
                React.DOM.ul( {id:'RightPanelToolbarDropDown', 'data-dropdown-content':true, className:"f-dropdown"}, 
                    React.DOM.li(null, React.DOM.a( {ref:"cleanEmAll"}, "Limpar"))
                )
            );
        }
    });

    RightPanel = React.createClass({displayName: 'RightPanel',

        getInitialState: function() {
            return {contentVisible: true};
        },

        componentDidMount: function () {
            
            var handler = _.throttle(
                function () {
                    
                    if (!this.isMounted()) return $(['#Console', window]).off('resize', handler);

                    var $elem = $(this.getDOMNode());

                    if ($elem && $('#Console').width() - $('#LeftPanel').width() !== $elem.width()) {
                        this.forceUpdate();
                    }

                }.bind(this),
            100);

            $(['#Console', window]).on('resize', handler);

        },

        toggleContent: function () {
            this.setState({contentVisible: !this.state.contentVisible});
        },

        cleanScheduleAndUpdate: function () {
            $.ajax({type: 'DELETE', url: pager.urls.ajax + 'console/schedule/' + this.props.day})
                .done(function () {

                    this.props.updateSchedule();
                    this.props.syncQueries();

                }.bind(this));
        },

        render: function () {
            var RouterCfg = pager.components.RouterCfg,
                s = {},
                actuallyVisible = this.state.contentVisible
                    && (this.props.schedule.length || this.props.routerLoader);
            
            if (actuallyVisible) s.width = $('#Console').width() - $('#LeftPanel').width();

            return React.DOM.main( {id:"RightPanel", style:s}, 
                actuallyVisible
                    ? React.DOM.div( {id:"RightPanelContent"}, 
                        this.props.routerLoader
                            ? React.DOM.div(null, 
                                React.DOM.h4(null, "Configurações de Roteamento"),
                                React.DOM.div( {className:"panel"}, 
                                    RouterCfg( {day:this.props.routerLoader._day, onSet:this.props.routerLoader} )
                                )
                             )
                            : null,
                        
                        this.props.schedule.length
                            ? Schedule( {schedule:this.props.schedule} )
                            : null,
                        
                        this.props.schedule.length
                            ? RightPanelToolbar( {schedule:this.props.schedule, emptySchedule:this.cleanScheduleAndUpdate} )
                            : null
                        

                    )
                    : null,
                
                this.props.schedule.length || this.props.routerLoader
                    ?
                        React.DOM.div( {id:"ToggleRightPanel", className:React.addons.classSet({lonesome: !actuallyVisible})}, 
                            React.DOM.i( {onClick:this.toggleContent, className:"fi-arrows-expand"})
                        )
                    : null
                
            );
        }
    });


    Console = React.createClass(_.merge({
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
            var aux, state = _.merge(this.parseArgsToState(), {
                mapState: pager.constant.console.map.AVAILABLE_TASKS,
                pending: [],
                queries: [],
                schedule: []
            });

            if (Modernizr.localstorage) {
                try{
                    aux = JSON.parse(localStorage.getItem('pager.' + pager.org.id + '.console.queries'));
                } catch (xxx) {
                    console.log(xxx);
                }

                state.queries = aux && aux.length
                    ? state.queries.concat(aux)
                    : state.queries;

            }

            return state;
        },

        componentWillReceiveProps: function (newProps) {

            var dayHasChanged = newProps.args.day && newProps.args.day !== this.state.day;

            this.setState(this.parseArgsToState(newProps), function () {


                if (dayHasChanged) {
                    emptyA(this.state.schedule);
                    this.updateSchedule();
                    this.syncQueries();
                }

                this.updateDefaultQuery(dayHasChanged);
                
            }.bind(this));

        },

        componentDidMount: function () {

            this.updateDefaultQuery(true);
            this.putArgs();

            var onResize = _.throttle(function () {
                
                if(!this.isMounted) return $(window).off('resize', onResize);
                this.forceUpdate();

            }.bind(this), 300);

            $(window).on('resize', onResize);

            this.updateSchedule(this.syncQueries);
            this.loadGoogleMaps();

        },



        componentWillUnmount: function () {
            clearTimeout(this.updateSchedule.__timeout);
            clearTimeout(this.syncQueries.__timeout);
        },
        
        putArgs: function () {
            var pieces = [pager.org.id, 'console', this.state.day, this.state.locations], uri;

            
            uri = '/' + pieces.join('/');

            if (uri !== Aviator.getCurrentURI()) {
                Aviator.navigate(uri);
            }
        },

        render: function () {

            var h = $(window).height() - $('#MainTopBar').outerHeight(), style = {'min-height': h};

            return React.DOM.div( {id:"Console", style:style}, 

                 this.state.hasGoogleMaps
                    ? Map( {queries:this.state.queries,
                            setTaskFocus:this.setTaskFocus,
                            routerWorker:this.state.routerWorker,
                            mapState:this.state.mapState,
                            height:h,
                            setMapState:this.setMapState,
                            selectedTask:this.state.selectedTask} )
                    : null,
                

                LeftPanel( {pending:this.state.pending,
                    routeTasks:this.initRouter,
                    queries:this.state.queries,
                    toggleRouterMode:this.toggleRouterMode,
                    saveRoute:this.saveRoute,
                    cancelRoute:this.cancelRoute,
                    day:this.state.day,
                    router:this.state.router,
                    locations:this.state.locations,
                    hasGoogleMaps:this.state.hasGoogleMaps,
                    setQueries:this.setQueries,
                    selectedTask:this.state.selectedTask,
                    setTaskFocus:this.setTaskFocus} ),

                RightPanel( {router:this.state.router,
                    updateSchedule:this.updateSchedule,
                    syncQueries:this.syncQueries,
                    schedule:this.state.schedule,
                    day:this.state.day,
                    totalWidth:$(window).width(),
                    routerLoader:this.state.routerLoader,
                    hasGoogleMaps:this.state.hasGoogleMaps} )
            );
        }

    }, cCompS, cCompR, cCompM, cCompQ));

    _.merge(pager.components, {UserLink: UserLink, ObjectLink: ObjectLink, AttrTable: AttrTable});

    pager.console = {};

    return Console;
});