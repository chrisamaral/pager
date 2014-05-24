/** @jsx React.DOM */
require.ensure(['./main', '../ext/aviator/main'], function(require){
    var Aviator = require('../ext/aviator/main'),
        container = $('#container .main-section')[0],
        pager = require('./main'),
        Main,
        AppRouteTarget,
        AppContainer,
        Views = {};

    function AppHandler (app) {

        var $view;

        var Handler = {

            init: function () {

                require(['./' + app], function (View) {

                    View.librarian.init(Main, function (TargetLib) {
                        Main.setProps({
                            view: View.component,
                            args: {},
                            lib: TargetLib
                        });
                    });

                });

            },
            setArgs: function (req) {
                Main.setProps({args: req.params});
            }
        };

        if (Views[app]) {
            _.merge(Handler, Views[app]);
        }

        return Handler;
    }

    AppContainer = React.createClass({
        render: function() {
            var TargetView = this.props.view || null;
            return  <div id='appContainer'>{ TargetView &&
                <TargetView
                    args={this.props.args}
                    lib={this.props.lib} />
            }</div>;
        }
    });

    AppRouteTarget = {

        goToMainPage: function (req) {
            var mainPage = pager.user.home ? pager.user.home.getValue() : 'console';
            Aviator.navigate(req.uri + '/' + mainPage);
        },

        setupLayout: function () {
            //nothing so far
            Main = React.renderComponent(<AppContainer view={null} />, container);
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