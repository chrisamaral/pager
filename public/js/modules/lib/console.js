/** @jsx React.DOM */
define(['./../lib/main', '../ext/aviator/main'], function (Cortex, Aviator) {
    var LeftPanel, RightPanel, Console;
    LazyLoad.css('/css/console.css');

    function locTranslate(loc){

        if (!loc) return '';
        if (_.isString(loc)) return loc;
        if (_.isArray(loc)) return loc.join(',');
        return '';
    }

    var onResize;

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
        componentDidMount: function(){
            onResize = _.throttle(function(){
                console.log('what the resize going on');
                this.setState({lastUpdate: Date.now});
            }.bind(this), 300);
            $(window).resize(onResize);
        },
        componentWillUnmount: function () {
            $(window).off('resize', onResize);
        },
        render: function () {
            var style = {minHeight: $(window).height() - $('.tab-bar').outerHeight()};
            if (!this.state.visible) style.display = 'none';
            return React.DOM.nav( {id:"LeftPanel", onClick:this.togglePanel, style:style}, 
                React.DOM.div(null, 
                    React.DOM.div( {id:"ConsoleQueue"}, "as"),
                    React.DOM.div( {id:"ConsolePool"}, "eee")
                )
            );
        }
    });

    Console = React.createClass({displayName: 'Console',
        getInitialState: function(){
            var loc = this.props.data.args.locations ? this.props.data.args.locations : [];
            loc = locTranslate(loc);
            return {
                day:
                    this.props.data.args.day
                        ? this.props.data.args.day.getValue()
                        : (new Date).toYMD(),
                locations: loc
            }
        },
        componentWillReceiveProps: function(Props) {
            console.log(Props);
        },
        putArgs: function(){
            var pieces = [Cortex.org.id.getValue(), 'console', this.state.day];

            if (this.state.locations.length) {
                pieces.push(this.state.locations);
            }

            Aviator.navigate('/' + pieces.join('/'));
        },

        render: function () {
            return React.DOM.div( {id:"Console"}, 
                LeftPanel(null ),
                React.DOM.main( {id:"RightPanel"}, 
                    "Direita"
                )
            );
        }
    });

    return Console;
});