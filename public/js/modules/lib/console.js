/** @jsx React.DOM */
define(['./../lib/main', '../ext/aviator/main', './console.queue', './console.tasks'], function (pager, Aviator, Queue, Tasks) {
    var LeftPanel,
        RightPanel,
        Console,
        onResize,
        UserLink,
        ObjectLink,
        Librarian;

    LazyLoad.css([
        '/css/console.css'/*,
        '/semantic/packaged/css/semantic.min.css',
        '/semantic/minified/button.min.css'*/
    ]);

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
            return React.DOM.tr( {className:classes}, 
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

    LeftPanel = React.createClass({displayName: 'LeftPanel',
        getInitialState: function () {
            return {
                visible: true,
                lastUpdate: Date.now()
            };
        },
        togglePanel: function () {
            this.setState({visible: !this.state.visible});
        },
        componentDidMount: function () {

            onResize = _.throttle(function () {
                this.setState({lastUpdate: Date.now});
            }.bind(this), 300);

            $(window).resize(onResize);
        },
        componentWillUnmount: function () {
            $(window).off('resize', onResize);
        },
        render: function () {
            var style = {};
            style = {height: $(window).height() - $('.tab-bar').outerHeight()};
            if (!this.state.visible) style.display = 'none';

            return React.DOM.nav( {id:"LeftPanel", style:style}, 
                React.DOM.div( {id:"LeftPanelWrapper"}, 
                     this.props.pending.length
                        ? Queue( {items:this.props.pending} ) : null, 
                    Tasks( {queries:this.props.queries, setQueries:this.props.setQueries} )
                )
            );
        }
    });

    RightPanel = React.createClass({displayName: 'RightPanel',
        render: function () {
            return React.DOM.main( {id:"RightPanel"}, 
                "Direita"
            );
        }
    });

    Console = React.createClass({displayName: 'Console',

        getInitialState: function () {
            var loc = this.props.args.locations ? this.props.args.locations : [];
            loc = locTranslate(loc);
            return {
                day:
                    this.props.args.day
                        ? this.props.args.day
                        : (new Date).toYMD(),
                locations: loc
            }
        },
        /*
        componentWillReceiveProps: function(Props) {
            console.log(Props);
        },*/

        componentDidMount: function () {
            this.putArgs();
        },

        putArgs: function(){
            var pieces = [pager.org.id, 'console', this.state.day], uri;

            if (this.state.locations.length) {
                pieces.push(this.state.locations);
            }
            uri = '/' + pieces.join('/');
            if (uri !== Aviator.getCurrentURI()) {
                Aviator.navigate(uri);
            }
        },
        setQueries: function (items) {
            this.props.lib.set('queries', items);
        },
        render: function () {
            return React.DOM.div( {id:"Console"}, 
                LeftPanel( {pending:this.props.lib.data.pending, 
                    queries:this.props.lib.data.queries, setQueries:this.setQueries} ),
                RightPanel(null )
            );
        }

    });

    function Lib(){
        this.data = {};
        this.component = null;
    }

    Lib.prototype.put = function(){
        if (Modernizr.localstorage) {
            localStorage.setItem('queries', JSON.stringify(this.data.queries.slice(1)));
        }
        this.component.setProps({lib: this});
    };
    
    Lib.prototype.set = function (collection, items) {
        
        if (collection === 'queries') {
            items = items.filter(function(item, index){
                return index === 0 || (item.tasks && item.tasks.length);
            });
        }

        this.data[collection] = items;
        this.put();
    };

    Lib.prototype.init = function (component, callback) {
        var aux;
        this.data = {
            pending: [],
            queries: [{
                name: 'Agenda',
                tasks: [],
                query: {
                    schedule: [(new Date()).toYMD()]
                }
            }],
            workers: []
        };

        if (Modernizr.localstorage) {
            var aux;
            try{
                aux = JSON.parse(localStorage.getItem('queries'));
            } catch (xxx) {
                console.log(xxx);
            }

            this.data.queries = aux && aux.length
                ? this.data.queries.concat(aux)
                : this.data.queries;
        }

        this.data.queries.forEach(function(query, index){
            $.get('/' + pager.org.id + '/api/console/tasks', query.query)
                .done(function (tasks) {
                    if(!_.isArray(tasks)){
                        return;
                    }
                    query.tasks = tasks;
                    this.put();

                }.bind(this));
        }.bind(this));

        this.component = component;

        callback(this);

        $.get('/json/console.pending.json')
            .done(function(result){
                try {
                    result = JSON.parse(result);
                    this.data.pending = result;
                    this.put();
                } catch (e) {
                    console.log(e);
                }
            }.bind(this));
    };

    _.merge(pager.components, {UserLink: UserLink, ObjectLink: ObjectLink, AttrTable: AttrTable});
    Librarian = new Lib();

    if (pager.isDev) {
        pager.console = Librarian;
    }

    return {
        component: Console,
        librarian: Librarian
    };
});