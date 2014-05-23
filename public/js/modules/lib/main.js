/** @jsx React.DOM */

define(['./utils'], function () {
    $(document).foundation();
    var PageList, cortex, pageMenu, mainComponent;
    PageList = React.createClass({displayName: 'PageList',
        render: function () {

            var icons = {
                    'Administração': 'fi-lock',
                    'Configurações': 'fi-wrench'
                },
                pages = this.props.pages.map(function (page) {
                    var icon = icons[page.name.getValue()];

                    return React.DOM.li( {key:page.name.getValue()}, 
                        React.DOM.a( {href:page.url.getValue()}, 
                            icon && React.DOM.i( {className:'the-icon ' + icon}),
                            page.name.getValue()
                        )
                    );

                }), baseUrl = this.props.urls.base.getValue();


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
    cortex = new Cortex(pager);
    pageMenu = React.renderComponent(PageList( {urls:cortex.urls, pages:cortex.pages} ), 
        $('#container .right-off-canvas-menu')[0]);
    
    cortex.on("update", function(newData) {
        pageMenu.setProps({pages: newData.pages});
    });
    
    $.get('/' + cortex.org.id.getValue() + '/api/pages')
        .done(function(pages){
            if(pages instanceof Array){
                pages.forEach(function(page){
                    cortex.pages.push(page);
                });
            }
        });

    require.run('./app');
    return cortex;
});