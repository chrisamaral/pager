define(['../helpers/utils.js'], function (utils) {
    return {
        setTaskFocus: function (taskId) {
            var sTask = taskId,
                mState = pager.constant.console.map.SELECTED_TASK;


            if (this.state.selectedTask === taskId
                && this.state.mapState ===
                pager.constant.console.map.SELECTED_TASK
                )
            {
                sTask = null;
                mState = pager.constant.console.map.AVAILABLE_TASKS;
            }


            this.setState({
                selectedTask: sTask,
                mapState: mState
            });
        },

        setMapState: function (state) {
            var st = {};

            st.mapState = state;

            if (state !== pager.constant.console.map.SELECTED_TASK) {
                st.selectedTask = undefined;
            }

            this.setState(st);
        },

        loadGoogleMaps: function () {
            console.log('loading google maps...');
            var that = this,
                rnd = Math.random().toString(36).substr(2),
                callback = function () {
                    _.delay(function delayedLoader() {

                        if (!that.isMounted()) return;

                        console.log('done loading google maps');
                        if (window['Pager_' + rnd]) {
                            delete window['Pager_' + rnd];
                        }

                        that.setState({hasGoogleMaps: true});
                    }, 500);
                };

            if (typeof google !== 'undefined' && google.maps) {
                return setTimeout(callback, 500);
            }

            utils.loadAPIKeys(function (keys) {
                window['Pager_' + rnd] = callback;

                LazyLoad.js(['https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=true&key=' + keys.google +
                    '&libraries=geometry&callback=Pager_' + rnd]);

            }.bind(this));
        }
    };
});