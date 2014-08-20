/** @jsx React.DOM */

define([
    '../ext/strftime',
    './console.leftpanel',
    './console.rightpanel',
    './console.map',
    '../lib/console.component.schedule.js',
    '../lib/console.component.router.js',
    '../lib/console.component.map.js',
    '../lib/console.component.queries.js'
], function (strftime, LeftPanel, RightPanel, Map, cCompSchedule, cCompRouter, cCompMap, cCompQueries) {
    var Aviator = pager.Aviator,
        Console,
        UserLink,
        AttrTable,
        AttrItem,
        ObjectLink;

    LazyLoad.css([pager.build.css.console]);

    function emptyA(A){
        while(A.length > 0) A.pop();
    }

    function locTranslate (loc) {

        if (!loc) return '';
        if (_.isString(loc)) return loc;
        if (_.isArray(loc)) return loc.join(',');
        return '';
    }

    UserLink = React.createClass({
        render: function () {
            if (this.props.user.url) {
                return <a target='_blank' title={this.props.user.full_name} href={this.props.user.url}>
                    {this.props.user.short_name}
                </a>;
            }
            return <strong title={this.props.user.full_name}>{this.props.user.short_name}</strong>;
        }
    });

    ObjectLink = React.createClass({
        render: function () {
            return <span>
                {this.props.object.adj ? ' ' + this.props.object.adj : null}
                <span> </span>
                {this.props.object.url
                    ? <a target='_blank' href={this.props.object.url}>{this.props.object.name}</a>
                    : <strong>{this.props.object.name}</strong>}
            </span>;
        }
    });

    AttrItem = React.createClass({
        toggleTb: function() {
            this.props.toggleCollapsed && this.props.toggleCollapsed();
        },
        render: function () {

            var attr = this.props.attr,

                classes = React.addons.classSet({
                    row: true,
                    'main-attr': attr.relevance === 3,
                    'important-attr': attr.relevance === 2
                }),

                val = attr.relevance === 3 && _.isString(attr.value)
                    ? attr.value.toUpperCase()
                    : _.isDate(attr.value)
                        ? strftime('%d/%m/%Y', attr.value)
                        : attr.value,

                hasDescr = attr.relevance !== 3 && attr.descr,

                otherClasses = React.addons.classSet({columns: true, 'small-8': hasDescr, 'small-12': !hasDescr});

            return <div className={classes} onClick={attr.relevance === 3 ? this.toggleTb : null }>
                {hasDescr ? <div className='small-4 columns'>{attr.descr}</div> : null}
                <div className={otherClasses} title={!hasDescr && attr.descr ? attr.descr : ''}>
                    {attr.url
                        ? <a href={attr.url} target='_blank'>{val}</a>
                        : val
                        }
                </div>
            </div>;
        }
    });

    AttrTable = React.createClass({
        getInitialState: function () {
            return {collapsed: !!this.props.collapsed};
        },
        toggleCollapsed: function () {
            this.setState({collapsed: !this.state.collapsed});
        },
        render: function () {
            var attrs = _.filter(this.props.attrs, {relevance: 3})
                .concat(_.filter(this.props.attrs, {relevance: 2}))
                .concat(_.filter(this.props.attrs, function(attr){
                    return !attr.relevance || attr.relevance <= 1;
                })),
                classes = React.addons.classSet({'attr-table': true, collapsed: this.state.collapsed});

            attrs = pager.helpers.dateAutoConv(attrs);

            return <div className={classes}>
                    {attrs.map(function(attr, index){
                        return <AttrItem key={index} attr={attr} toggleCollapsed={index === 0 ? this.toggleCollapsed : null} />;
                    }.bind(this))}
            </div>;
        }
    });

    Console = React.createClass({
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
                }

                this.updateDefaultQuery(dayHasChanged);

            }.bind(this));

        },

        componentDidMount: function () {
            $('body').css('overflow-y', 'scroll');
            this.updateDefaultQuery(true);
            this.putArgs();

            var onResize = _.throttle(function () {

                if(!this.isMounted()) return $(window).off('resize', onResize);

                this.setState({myHeight: $(window).height() - $('#MainTopBar').outerHeight()});

            }.bind(this), 300);

            $(window).on('resize', onResize);

            this.updateSchedule(this.syncQueries);
            this.loadGoogleMaps();

        },


        componentWillUnmount: function () {
            $('body').css('overflow-y', '');
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

        setTaskFocus: cCompMap.setTaskFocus,
        setMapState: cCompMap.setMapState,
        loadGoogleMaps: cCompMap.loadGoogleMaps,

        updateDefaultQuery: cCompQueries.updateDefaultQuery,
        setQueries: cCompQueries.setQueries,
        fetchQuery: cCompQueries.fetchQuery,
        fetchQueries: cCompQueries.fetchQueries,
        syncQueries: cCompQueries.syncQueries,

        toggleRouterMode: cCompRouter.toggleRouterMode,
        killRoute: cCompRouter.killRoute,
        saveRoute: cCompRouter.saveRoute,
        cancelRoute: cCompRouter.cancelRoute,
        startRouter: cCompRouter.startRouter,
        initRouter: cCompRouter.initRouter,

        updateSchedule: cCompSchedule.updateSchedule,

        render: function () {

            var h = this.state.myHeight || $(window).height() - $('#MainTopBar').outerHeight(),
                style = {'min-height': h};

            return <div id='Console' style={style}>

                { this.state.hasGoogleMaps
                    ? <Map queries={this.state.queries}
                            setTaskFocus={this.setTaskFocus}
                            routerWorker={this.state.routerWorker}
                            mapState={this.state.mapState}
                            height={h}
                            setMapState={this.setMapState}
                            selectedTask={this.state.selectedTask} />
                    : null
                    }

                <LeftPanel pending={this.state.pending}
                    routeTasks={this.initRouter}
                    queries={this.state.queries}
                    toggleRouterMode={this.toggleRouterMode}
                    saveRoute={this.saveRoute}
                    cancelRoute={this.cancelRoute}
                    day={this.state.day}
                    router={this.state.router}
                    locations={this.state.locations}
                    hasGoogleMaps={this.state.hasGoogleMaps}
                    setQueries={this.setQueries}
                    selectedTask={this.state.selectedTask}
                    setTaskFocus={this.setTaskFocus} />

                <RightPanel router={this.state.router}
                    updateSchedule={this.updateSchedule}
                    syncQueries={this.syncQueries}
                    schedule={this.state.schedule}
                    day={this.state.day}
                    totalWidth={$(window).width()}
                    routerLoader={this.state.routerLoader}
                    hasGoogleMaps={this.state.hasGoogleMaps} />
            </div>;
        }

    });

    _.merge(pager.components, {UserLink: UserLink, ObjectLink: ObjectLink, AttrTable: AttrTable});

    pager.console = {};

    return Console;
});