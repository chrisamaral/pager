/** @jsx React.DOM */

define(['../helpers/utils'], function (utils) {
    var zIndexAltered = false, Root, PageList, uri = location.pathname.split('/');

    if (!uri[1]) {
        $('body').html('<h1>Erro</h1>');
        return;
    }

    pager.org = {id: uri[1]};

    setInterval(function() {

        if ($('.clearing-blackout').length) {
            $('#TopBar').css('z-index', '-1');
            zIndexAltered = true;
        } else if( zIndexAltered ) {
            $('#TopBar').css('z-index', '');
            zIndexAltered = false;
        }

    }, 1000);

    PageList = React.createClass({displayName: 'PageList',
        render: function () {

            var icons = {
                    'Administração': 'fi-lock',
                    'Configurações': 'fi-wrench'
                },
                pages = this.props.pages.map(function (page) {
                    var icon = icons[page.name];

                    return React.DOM.li( {key:page.name}, 
                        React.DOM.a( {href:page.url}, 
                                icon && React.DOM.i( {className:'the-icon ' + icon}),
                                page.name
                        )
                    );

                }), baseUrl = this.props.urls.base;


            pages.unshift(React.DOM.li( {key:'usr.home'}, 
                React.DOM.a( {href:baseUrl + '/home'}, 
                    React.DOM.i( {className:"the-icon fi-home"}),
                "Início"
                )
            ));
            pages.unshift(React.DOM.li( {key:'placeholder'}, React.DOM.label(null, "Menu")));
            pages.push(React.DOM.li( {key:"usr"}, React.DOM.label(null, "Usuário")));
            pages.push(React.DOM.li( {key:'usr.settings'}, 
                React.DOM.a( {href:baseUrl + '/user'}, 
                    React.DOM.i( {className:"the-icon fi-torso"}),
                "Configurações"
                )
            ));
            pages.push(React.DOM.li( {key:'usr.logout'}, 
                React.DOM.a( {href:baseUrl + '/logout'}, 
                    React.DOM.i( {className:"the-icon fi-x"}),
                "Logout"
                )
            ));

            return React.DOM.ul( {className:"off-canvas-list"}, pages);
        }
    });

    Root = React.createClass({displayName: 'Root',
        componentDidMount: function () {
            $(document).foundation();
        },
        render: function () {
            var App = this.props.app;
            return (
                React.DOM.div( {id:"ScrollRoot", 'data-offcanvas':true, className:"off-canvas-wrap"}, 
                    React.DOM.div( {className:"inner-wrap"}, 
                        React.DOM.nav( {id:"TopBar", className:"tab-bar"}, 
                            React.DOM.section( {className:"middle tab-bar-section"}, 
                                React.DOM.h1( {className:"title"}, "Pager - Sim Tv")
                            ),
                            React.DOM.section( {className:"right-small"}, 
                                React.DOM.a( {className:"right-off-canvas-toggle menu-icon"}, 
                                    React.DOM.span(null)
                                )
                            )
                        ),
                        React.DOM.aside( {className:"right-off-canvas-menu"}, 
                            PageList( {urls:this.props.urls, pages:this.props.pages} )
                        ),
                        React.DOM.section( {className:"main-section"}, 
                             App &&
                                App( {view:this.props.view,
                                        args:this.props.args,
                                            lib:this.props.lib} )
                            
                        )
                    )
                )
            );
        }
    });

    pager.pages = [];
    pager.components = {};

    function loadFromLocalStorage(item) {
        var aux = localStorage.getItem('pager.' + pager.org.id + '.' + item);
        pager[item] = aux && JSON.parse(aux) || pager[item];
    }

    if (Modernizr.localstorage) {
        ['urls', 'pages', 'org', 'user'].forEach(function (item) {
            loadFromLocalStorage(item);
        });
    }

    function saveAll(){
        ['urls', 'pages', 'org', 'user', 'org', 'build'].forEach(function (key) {
            var item = pager[key];
            if (item && Modernizr.localstorage) {
                localStorage.setItem('pager.' + pager.org.id + '.' + key, JSON.stringify(item));
            }
        });
    }

    function init () {

        pager.rootElem = React.renderComponent(Root( {urls:pager.urls, pages:pager.pages} ),
            document.getElementById('container'));

        $.get('/' + pager.org.id + '/api/pages')
            .done(function (pages) {
                if (pages instanceof Array) {
                    pager.pages = pages.concat();
                    pager.rootElem.setProps({pages: pager.pages});
                }
                saveAll();
            });

        require.run('./app');
    }

    $( document ).ajaxError(function( event, jqxhr ) {

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
            }).always(init);
    }

    return pager;
});