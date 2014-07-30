/** @jsx React.DOM */

define(['../helpers/utils', '../helpers/consts', '../ext/aviator/main'], function (utils, consts, Aviator) {

    if (Modernizr.touch) React.initializeTouchEvents(true);
    pager.constant = consts;
    pager.helpers = utils;
    var mainComponent;

    var Root,
        PageList,
        uri = location.pathname.split('/');

    if (!uri[1]) {
        return $('body').html('<h1>Erro</h1>');
    }

    pager.org = {id: uri[1]};
    
    PageList = React.createClass({
        navigateTo: function (e) {
            var uri = $(e.currentTarget).attr('href'),
                shouldUseAviatorNavigate = uri.charAt(0) === '/' && uri.substr(0, 2) !== '//';

            shouldUseAviatorNavigate = shouldUseAviatorNavigate && !e.ctrlKey;
            shouldUseAviatorNavigate = shouldUseAviatorNavigate && e.button === 0;

            if (shouldUseAviatorNavigate) {
                e.preventDefault();
                pager.Aviator.navigate(uri);
            }
        },
        render: function () {

            var icons = {
                    'acw_admin': 'fi-lock',
                    'pager_admin': 'fi-wrench',
                    'console': 'fi-map'
                },

                pagesEnabled = this.props.pagesEnabled.map(function (page) {
                    var icon = icons[page.id];

                    return <li key={page.name}>
                        <a onClick={this.navigateTo} href={page.url}>
                            {icon ? <i className={'the-icon ' + icon}></i> : null}
                            {page.name}
                        </a>
                    </li>;

                }.bind(this)), baseUrl = this.props.urls.base;


            pagesEnabled.unshift(<li key={'usr.home'}>
                <a href={baseUrl + '/home'}>
                    <i className='the-icon fi-home'></i>
                Início
                </a>
            </li>);

            pagesEnabled.unshift(<li key={'placeholder'}><label>Menu</label></li>);
            pagesEnabled.push(<li key='usr'><label>Usuário</label></li>);

            pagesEnabled.push(<li key={'usr.settings'}>
                <a href={baseUrl + '/user'}>
                    <i className='the-icon fi-torso'></i>
                Configurações
                </a>
            </li>);

            pagesEnabled.push(<li key={'usr.logout'}>
                <a href={baseUrl + '/logout'}>
                    <i className='the-icon fi-x'></i>
                Logout
                </a>
            </li>);

            return <ul className="dropdown">{pagesEnabled}</ul>;
        }
    });

    function getAppIDFromURI (uri) {
        return uri.split('/')[2] || null
    }

    Root = React.createClass({

        getInitialState: function () {
            return {
                currentView: null,
                args: {},
                pagesEnabled: pager.pagesEnabled,
                urls: pager.urls,
                lastAppChange: Date.now()
            };
        },

        initializeApp: function (req) {

            var view = getAppIDFromURI(req.uri),
                run = function (View) {

                    mainComponent = View;
                    this.setState({lastAppChange: Date.now()});

                };

            this.setState({args: req.params, currentView: view});

            require(['./' + view], run.bind(this));

        },

        setAppArgs: function (req) {
            if (getAppIDFromURI(req.uri) !== this.state.currentView) {
                return this.initializeApp(req);
            }

            this.setState({args: req.params});
        },

        componentDidMount: function () {
            $(document).foundation();

            var AppRouteTarget = {

                goToMainPage: function (req) {
                    var mainPage = pager.user.home || 'console';
                    Aviator.navigate((req.uri + '/').replace('//', '/') + mainPage);
                },

                setupLayout: function () {
                    //nothing so far
                    //pager.rootElem.setProps({app: AppContainer});
                }

            };

            Aviator.setRoutes({
                target: AppRouteTarget,
                '/*': 'setupLayout',
                '/:org': {
                    '/': 'goToMainPage',
                    '/console': {
                        target: this,
                        '/': 'initializeApp',
                        '/:day/:locations': 'setAppArgs'
                    },
                    '/admin': {
                        target: this,
                        '/': 'initializeApp',
                        '/:view': 'setAppArgs'
                    }
                }
            });
            Aviator.dispatch();

            pager.Aviator = Aviator;

            $.get('/' + pager.org.id + '/api/pages')
                .done(function (myPages) {

                    if (_.isArray(myPages)) {
                        pager.pagesEnabled = myPages.concat();
                        this.setState({pagesEnabled: myPages});
                    }

                    saveAll();

                }.bind(this));
        },

        render: function () {
            var App = mainComponent;

            return (<div>
                <div className='fixed'>
                    <nav id='MainTopBar' className="top-bar" data-topbar>

                        <ul className="title-area">
                            <li className="name">
                                <h1><a>{'Pager' + (pager.org && pager.org.name ? ' - '  + pager.org.name : '')}</a></h1>
                            </li>
                            <li className="toggle-topbar menu-icon">
                                <a href="#"><span>Menu</span></a>
                            </li>
                        </ul>

                        <section className="top-bar-section">
                            <ul className="right">
                                <li className="has-dropdown">
                                    <a>Menu</a>
                                    <PageList urls={this.state.urls} pagesEnabled={this.state.pagesEnabled} />
                                </li>
                            </ul>
                        </section>

                    </nav>
                </div>
                { App && <App args={this.state.args} /> }
            </div>);
        }
    });

    pager.pagesEnabled = [];
    pager.components = {};

    function loadFromLocalStorage(item) {
        var aux = localStorage.getItem('pager.' + pager.org.id + '.' + item);
        pager[item] = aux && JSON.parse(aux) || pager[item];
    }

    if (Modernizr.localstorage) {
        ['urls', 'pagesEnabled', 'org', 'user'].forEach(function (item) {
            loadFromLocalStorage(item);
        });
    }

    function saveAll () {
        ['urls', 'pagesEnabled', 'org', 'user', 'org', 'build'].forEach(function (key) {
            var item = pager[key];
            if (item && Modernizr.localstorage) {
                localStorage.setItem('pager.' + pager.org.id + '.' + key, JSON.stringify(item));
            }
        });
    }



    $(document).ajaxError(function(event, jqxhr) {

        if (jqxhr.status === 401) {

            if (pager.urls) {
                location.href = pager.urls.base + '/login';
                return;
            }

            location.reload(true);
        }
    });

    if (pager.org) {
        $.get('/' + pager.org.id + '/api')
            .done(function (result) {
                if (_.isObject(result)) {
                    _.merge(pager, result);
                    pager.urls.ajax = '/' + pager.org.id + '/api/';
                    saveAll();
                }
            }).always(function () {

                pager.rootElem = React.renderComponent(<Root />,
                    document.getElementById('container'));

            });
    }

    return pager;
});