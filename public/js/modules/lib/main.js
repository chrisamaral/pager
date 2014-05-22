/** @jsx React.DOM */

define(function () {
    var Pager, PageList, cortex, mainComponent;
    //LazyLoad.css('');
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

    Pager = React.createClass({displayName: 'Pager',
        getInitialState: function(){
            return {menuOpen: false};
        },
        toggleMenu: function (e) {
            e.preventDefault();
            e.stopPropagation();
            this.setState({menuOpen: !this.state.menuOpen});
        },
        render: function () {
            var classes = React.addons.classSet({"off-canvas-wrap": true, "move-left": this.state.menuOpen});
            return React.DOM.div( {className:classes, 'data-offcanvas':true}, 
                React.DOM.div( {className:"inner-wrap"}, 
                    React.DOM.nav( {className:"tab-bar"}, 
                        React.DOM.section( {className:"middle tab-bar-section"}, 
                            React.DOM.h1( {className:"title"}, 'Pager - ' + pager.org.name)
                        ),
                        React.DOM.section( {className:"right-small"}, 
                            React.DOM.a( {className:"right-off-canvas-toggle menu-icon", onClick:this.toggleMenu}, 
                                React.DOM.span(null)
                            )
                        )
                    ),
                    React.DOM.aside( {className:"right-off-canvas-menu"}, 
                        PageList( {urls:this.props.pager.urls, pages:this.props.pager.pages} )
                    ),
                    React.DOM.section( {className:"main-section"}, 
                        React.DOM.div( {className:"row"}, 
                            React.DOM.div( {className:"large-12 columns"}, 
                                React.DOM.br(null),
                                React.DOM.h4(null, "Boring")
                            )
                        )
                    )
                )
            );
        }
    });

    pager.pages = [];
    cortex = new Cortex(pager);
    mainComponent = React.renderComponent(Pager( {pager:cortex}), document.getElementById('container'));

    cortex.on("update", function(updatedOrder) {
      mainComponent.setProps({order: updatedOrder});
    });

    $.get('/' + cortex.org.id.getValue() + '/pages')
        .done(function(pages){
            if(pages instanceof Array){
                pages.forEach(function(page){
                    cortex.pages.push(page);
                });
            }
        });

    return {cortex: cortex, root: mainComponent};
});
