define(['../ext/strftime'], function(strftime){
    var shifts =
        [
            {from: '08:00', to: '17:00'},
            {from: '11:00', to: '20:00'},
            {from: '14:00', to: '23:00'}
        ];
    function Router (day, tasks, workers) {
        this.day = day;
        this.tasks = tasks.concat();
        this.workers = workers.concat();
    }

    Router.prototype.init = function () {

        var day = this.day, todaySchedule = function (task) {
                var scheduleDay = task.schedule ? new Date(task.schedule.from) : null;
                return scheduleDay && scheduleDay.toYMD() === day;
            }, Tasks = {};

        this.tasks.forEach(function(task){
            var category = 'today';
            if (!todaySchedule(task)) {
                category = 'others';
            }
            Tasks[category] = Tasks[category] || [];
            Tasks[category].push(task);
        });

        console.log(Tasks);
    };

    return Router;
});