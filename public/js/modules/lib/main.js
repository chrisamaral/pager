/** @jsx React.DOM */

define(['../helpers/utils'], function () {
    $(document).foundation();
    var zIndexAltered = false;
    setInterval(function() {

        if ($('.clearing-blackout').length) {
            $('#TopBar').css('z-index', '-1');
            zIndexAltered = true;
        } else if( zIndexAltered ) {
            $('#TopBar').css('z-index', '');
            zIndexAltered = false;
        }

    }, 1000);

    var pageMenu,
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

    pager.pages = [];
    pager.components = {};
    pageMenu = React.renderComponent(PageList( {urls:pager.urls, pages:pager.pages} ),
        $('#container .right-off-canvas-menu')[0]);
    

    $.get('/' + pager.org.id + '/api/pages')
        .done(function (pages) {
            if (pages instanceof Array) {
                pager.pages = pages.concat();
                pageMenu.setProps({pages: pager.pages});
            }
        });

    require.run('./app');
    return pager;
});