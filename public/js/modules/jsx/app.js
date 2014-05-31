/** @jsx React.DOM */
require.ensure(['../ext/aviator/main'], function(require){
    var Aviator = require('../ext/aviator/main'),
        AppRouteTarget,
        AppContainer,
        Views = {};

    function AppHandler (app) {

        var $view;

        var Handler = {

            init: function () {

                require(['./' + app], function (View) {

                    View.librarian.init(pager.rootElem, function (TargetLib) {
                        pager.rootElem.setProps({
                            view: View.component,
                            args: {},
                            lib: TargetLib
                        });
                    });

                });

            },
            setArgs: function (req) {
                pager.rootElem.setProps({args: req.params});
            }
        };

        if (Views[app]) {
            _.merge(Handler, Views[app]);
        }

        return Handler;
    }

    AppContainer = React.createClass({
        render: function () {
            var TargetView = this.props.view || null;
            return  <div id='appContainer'>
                { TargetView && <TargetView args={this.props.args} lib={this.props.lib} /> }
            </div>;
        }
    });

    AppRouteTarget = {

        goToMainPage: function (req) {
            var mainPage = pager.user.home ? pager.user.home.getValue() : 'console';
            Aviator.navigate(req.uri + (req.uri.charAt(req.uri.length - 1) === '/' ? '' : '/') + mainPage);
        },

        setupLayout: function () {
            //nothing so far
            pager.rootElem.setProps({app: AppContainer});
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