/** @jsx React.DOM */
require.ensure(['./main', '../ext/aviator/main'], function(require){
    var Aviator = require('../ext/aviator/main'),
        container = $('#container .main-section')[0],
        cortex = require('./main'),
        Main,
        AppRouteTarget,
        AppContainer,
        PlaceHolder = React.createClass({render: function() { return <div></div>; }});
        View = PlaceHolder,
        Views = {};

    function AppHandler (app) {
        var Handler = {
            init: function () {
                var AppView;
                if (!cortex[app]) {
                    cortex.add(app, {});
                    cortex[app].add('args', {});
                }

                require(['./' + app], function (App) {
                    Main.setProps({view: <App user={cortex.user} data={cortex[app]} />});
                });

            },
            setArgs: function (req) {
                cortex[app].args.setValue(req.params);
            }
        };

        if (Views[app]) {
            _.merge(Handler, Views[app]);
        }

        return Handler;
    }

    AppContainer = React.createClass({
        render: function() {
            var TargetView = this.props.view;
            return  <div id='appContainer'>{TargetView ? TargetView : null}</div>;
        }
    });

    AppRouteTarget = {
        goToMainPage: function (req) {
            var mainPage = cortex.user.home ? cortex.user.home.getValue() : 'console';
            Aviator.navigate(req.uri + '/' + mainPage);
        },
        setupLayout: function () {
            Main = React.renderComponent(<AppContainer view={null}/>, container);
        }
    };

    Aviator.setRoutes({
        target: AppRouteTarget,
        '/*': 'setupLayout',
        '/:org': {
            '/': 'goToMainPage',
            '/console': {
                target: AppHandler('console'),
                '/*': 'init',
                '/:day': 'setArgs',
                '/:day/:locations': 'setArgs'
            }
        }
    });

    Aviator.dispatch();
});