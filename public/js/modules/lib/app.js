/** @jsx React.DOM */
require(['../ext/aviator/main'], function(Aviator){
    var AppRouteTarget,
        AppContainer,
        CachedViews = {},
        Views = {};

    function AppHandler (app) {

        var Handler = {
            initialized: false,
            init: function (req) {

                this.initialized = true;
                var run = function (View) {
                    pager.rootElem.setProps({
                        args: req.params,
                        view: View
                    });
                };
                if (CachedViews[app]) {
                    return run(CachedViews[app]);
                }
                require(['./' + app], run);
            },
            setArgs: function (req) {

                if (!this.initialized) {
                    return this.init(req);
                }

                pager.rootElem.setProps({args: _.cloneDeep(req.params)});
            }
        };

        if (Views[app]) {
            _.merge(Handler, Views[app]);
        }

        return Handler;
    }

    AppContainer = React.createClass({displayName: 'AppContainer',
        render: function () {
            var TargetView = this.props.view || null;
            return  React.DOM.div( {id:"appContainer"}, 
                 TargetView && TargetView( {args:this.props.args} ) 
            );
        }
    });

    AppRouteTarget = {

        goToMainPage: function (req) {
            var mainPage = pager.user.home ? pager.user.home : 'console';
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
                '/': 'init',
                '/:day/:locations': 'setArgs'
            }
        }
    });

    Aviator.dispatch();

    if (pager.isDev) {
        pager.Aviator = Aviator;
    }

});