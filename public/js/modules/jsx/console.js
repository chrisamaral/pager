/** @jsx React.DOM */
define(['./../lib/main', '../ext/aviator/main', './console.queue'], function (pager, Aviator, Queue) {
    var LeftPanel,
        RightPanel,
        Console,
        onResize,
        OtherTasks,
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

    OtherTasks = React.createClass({
        render: function(){
            return <div>Nothing to see here...</div>;
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
                    { this.props.loose.length
                        ? <OtherTasks /> : null }
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

        componentWillReceiveProps: function(Props) {
            console.log(Props);
        },

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
                <LeftPanel pending={this.props.lib.data.pending} loose={this.props.lib.data.loose} />
                <RightPanel />
            </div>;
        }

    });

    function Lib(){
        this.data = {};
        this.component = null;
    }

    Lib.prototype.init = function (component, callback) {
        this.data = {
            pending: [
                {
                    id: 'xxxxxxx',
                    subject: pager.user,
                    predicate: 'finalizou 3 ordens',
                    object: {
                        name: 'Jesus Cristo',
                        adj: 'de',
                        url: 'http://youtube.com'
                    },
                    attrs: [
                        {
                            descr: 'Inútil',
                            value: 'Valor Inútil'
                        },
                        {
                            descr: 'Assinante',
                            value: 'Asmirindo da Silva',
                            relevance: 3
                        },
                        {
                            descr: 'Inútil',
                            value: 'Valor Inútil'
                        },
                        {
                            descr: 'Inútil',
                            value: 'Valor Inútil',
                            relevance: 2
                        },
                        {
                            descr: 'Inútil',
                            value: 'Valor Inútil',
                            url: 'http://google.com'
                        }
                    ],
                    pics: [
                        {
                            src: 'https://fbcdn-sphotos-a-a.akamaihd.net/hphotos-ak-prn2/t1.0-9/10172615_618191988277930_598428880313359111_n.jpg',
                            descr: 'suicide tendencies'
                        },
                        {
                            src: 'https://fbcdn-sphotos-d-a.akamaihd.net/hphotos-ak-frc3/t1.0-9/10175004_775799969119781_6070044369723313409_n.jpg',
                            descr: 'no country for old men'
                        },
                        {
                            src: 'https://scontent-a.xx.fbcdn.net/hphotos-prn2/t1.0-9/10295784_10152391158666294_7513131584187353529_n.jpg',
                            descr: "Now that we know who you are, I know who I am. I'm not a mistake! It all makes sense! In a comic, you know how you can tell who the arch-villain's going to be? He's the exact opposite of the hero. And most times they're friends, like you and me! I should've known way back when... You know why, David? Because of the kids. They called me Mr Glass."
                        }
                    ],
                    tasks: [
                        {
                            id: 'JJJ',
                            attrs: [
                                {
                                    descr: 'Inútil',
                                    value: 'Valor Inútil',
                                    url: 'http://google.com'
                                },
                                {
                                    descr: 'Assinante',
                                    value: 'Reclamação',
                                    relevance: 3
                                },
                                {
                                    descr: 'Inútil',
                                    value: 'Valor Inútil'
                                },
                                {
                                    descr: 'Inútil',
                                    value: 'Valor Inútil',
                                    relevance: 2
                                }
                            ]
                        },
                        {
                            id: 'KKKK',
                            attrs: [
                                {
                                    descr: 'Inútil',
                                    value: 'Valor Inútil',
                                    url: 'http://google.com'
                                },
                                {
                                    descr: 'Assinante',
                                    value: 'Asmirindo da Silva',
                                    relevance: 3
                                },
                                {
                                    descr: 'Inútil',
                                    value: 'Valor Inútil'
                                },
                                {
                                    descr: 'Inútil',
                                    value: 'Valor Inútil',
                                    relevance: 2
                                }
                            ]
                        }
                    ],
                    timestamp: new Date()
                }
            ],
            loose: [],
            workers: []
        };
        this.component = component;
        callback(this);
    };

    _.merge(pager.components, {UserLink: UserLink, ObjectLink: ObjectLink});

    return {
        component: Console,
        librarian: new Lib()
    };
});