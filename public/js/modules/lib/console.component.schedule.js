define(function() {
    return {
        updateSchedule: function (callback) {

            if (!this.isMounted()) return;

            clearTimeout(this.updateSchedule.__timeout);

            $.get(pager.urls.ajax + 'console/schedule/' + this.state.day)

                .always(function () {
                    if (!this.isMounted()) return;

                    this.updateSchedule.__timeout = setTimeout(this.updateSchedule,
                        pager.constant.console.WHOLE_SCHEDULE_UPDATE_INTERVAL);

                    callback && callback();

                }.bind(this))

                .done(function (result) {
                    if (!this.isMounted()) return;
                    callback && callback();
                    this.setState({schedule: result});
                }.bind(this));
        },
        setScheduleMover: function (s) {
            this.setState({selectedSchedule: s});
        }
    };
});