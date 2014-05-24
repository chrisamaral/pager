/** @jsx React.DOM */
define(['./../lib/main', '../ext/aviator/main', './console.queue', './console.tasks'], function (pager, Aviator, Queue, Tasks) {
    var LeftPanel,
        RightPanel,
        Console,
        onResize,
        UserLink,
        ObjectLink;

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

    LeftPanel = React.createClass({
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

            var style = {height: $(window).height() - $('.tab-bar').outerHeight()};
            if (!this.state.visible) style.display = 'none';

            return <nav id='LeftPanel' style={style}>
                <div id='LeftPanelWrapper'>
                    { this.props.pending.length
                        ? <Queue items={this.props.pending} /> : null }
                    { this.props.tasks.length
                        ? <Tasks /> : null }
                </div>
            </nav>;
        }
    });

    RightPanel = React.createClass({
        render: function () {
            return <main id='RightPanel'>
                Direita
            </main>;
        }
    });

    Console = React.createClass({

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

        render: function () {
            return <div id='Console'>
                <LeftPanel pending={this.props.lib.data.pending} tasks={this.props.lib.data.tasks} />
                <RightPanel />
            </div>;
        }

    });

    function Lib(){
        this.data = {};
        this.component = null;
    }

    Lib.prototype.put = function(){
        this.component.setProps({lib: this});
    };

    Lib.prototype.init = function (component, callback) {
        this.data = {
            pending: [],
            tasks: [],
            workers: []
        };
        this.component = component;

        callback(this);

        $.get('/json/console.pending.json')
            .done(function(result){
                this.data.pending = result;
                this.put();
            }.bind(this));
        $.get('/json/console.tasks.json')
            .done(function(result){
                this.data.tasks = result;
                this.put();
            }.bind(this));
    };

    _.merge(pager.components, {UserLink: UserLink, ObjectLink: ObjectLink});

    return {
        component: Console,
        librarian: new Lib()
    };
});