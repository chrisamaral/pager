/** @jsx React.DOM */
(function () {
    var Pager = React.createClass({displayName: 'Pager',
        render: function () {
            return React.DOM.div( {className:"off-canvas-wrap", 'data-offcanvas':true}, 
                React.DOM.div( {className:"inner-wrap"}, 
                    React.DOM.nav( {className:"tab-bar"}, 
                        React.DOM.section( {className:"middle tab-bar-section"}, 
                            React.DOM.h1( {className:"title"}, "Nome")
                        )
                    )
                )
            );
        }
    });
    React.renderComponent(Pager(null ), document.body);
}());
