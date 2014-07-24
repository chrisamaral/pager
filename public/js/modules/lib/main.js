/** @jsx React.DOM */

define(['../helpers/utils', '../helpers/consts', '../ext/aviator/main'], function (utils, consts, Aviator) {

    if (Modernizr.touch) React.initializeTouchEvents(true);
    pager.constant = consts;
    var mainComponent;

    var Root,
        PageList,
        uri = location.pathname.split('/');

    if (!uri[1]) {
        return $('body').html('<h1>Erro</h1>');
    }

    pager.org = {id: uri[1]};
    
    PageList = React.createClass({displayName: 'PageList',
        navigateTo: function (e) {
            var uri = $(e.currentTarget).attr('href');
            if (uri.charAt(0) === '/' && uri.substr(0, 2) !== '//') {
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

                    return React.DOM.li( {key:page.name}, 
                        React.DOM.a( {onClick:this.navigateTo, href:page.url}, 
                            icon ? React.DOM.i( {className:'the-icon ' + icon}) : null,
                            page.name
                        )
                    );

                }.bind(this)), baseUrl = this.props.urls.base;


            pagesEnabled.unshift(React.DOM.li( {key:'usr.home'}, 
                React.DOM.a( {href:baseUrl + '/home'}, 
                    React.DOM.i( {className:"the-icon fi-home"}),
                "Início"
                )
            ));

            pagesEnabled.unshift(React.DOM.li( {key:'placeholder'}, React.DOM.label(null, "Menu")));
            pagesEnabled.push(React.DOM.li( {key:"usr"}, React.DOM.label(null, "Usuário")));

            pagesEnabled.push(React.DOM.li( {key:'usr.settings'}, 
                React.DOM.a( {href:baseUrl + '/user'}, 
                    React.DOM.i( {className:"the-icon fi-torso"}),
                "Configurações"
                )
            ));

            pagesEnabled.push(React.DOM.li( {key:'usr.logout'}, 
                React.DOM.a( {href:baseUrl + '/logout'}, 
                    React.DOM.i( {className:"the-icon fi-x"}),
                "Logout"
                )
            ));

            return React.DOM.ul( {className:"dropdown"}, pagesEnabled);
        }
    });

    function getAppIDFromURI (uri) {
        return uri.split('/')[2] || null
    }

    Root = React.createClass({displayName: 'Root',

        getInitialState: function () {
            return {
                currentView: null,
                args: {},
                pagesEnabled: pager.pagesEnabled,
                urls: pager.urls
            };
        },

        initializeApp: function (req) {

            var view = getAppIDFromURI(req.uri),
                run = function (View) {

                    mainComponent = View;
                    this.forceUpdate();

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

            return (React.DOM.div(null, 
                React.DOM.div( {className:"fixed"}, 
                    React.DOM.nav( {id:"MainTopBar", className:"top-bar", 'data-topbar':true}, 

                        React.DOM.ul( {className:"title-area"}, 
                            React.DOM.li( {className:"name"}, 
                                React.DOM.h1(null, React.DOM.a(null, 'Pager' + (pager.org && pager.org.name ? ' - '  + pager.org.name : '')))
                            ),
                            React.DOM.li( {className:"toggle-topbar menu-icon"}, 
                                React.DOM.a( {href:"#"}, React.DOM.span(null, "Menu"))
                            )
                        ),

                        React.DOM.section( {className:"top-bar-section"}, 
                            React.DOM.ul( {className:"right"}, 
                                React.DOM.li( {className:"has-dropdown"}, 
                                    React.DOM.a(null, "Menu"),
                                    PageList( {urls:this.state.urls, pagesEnabled:this.state.pagesEnabled} )
                                )
                            )
                        )

                    )
                ),
                 App && App( {args:this.state.args} ) 
            ));
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

                pager.rootElem = React.renderComponent(Root(null ),
                    document.getElementById('container'));

            });
    }

    return pager;
});