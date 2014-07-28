/** @jsx React.DOM */
define(['../ext/strftime'], function (strftime) {
    var ScheduleView, ScheduleRow, ScheduleTimeLine, ScheduleTask;

    ScheduleTask = React.createClass({displayName: 'ScheduleTask',

        render: function () {
            var w, myIni, leftPos;

            w = (this.props.task.duration + (this.props.task.directions.duration.value * 1000)) * this.props.microSecondWidth;
            myIni = new Date(this.props.task.directions.schedule.ini);
            leftPos = (myIni.getTime() - this.props.timelineBoundaries.ini.getTime()) * this.props.microSecondWidth;

            leftPos += this.props.index * 3;

            return React.DOM.div({className: "scheduleTask", style: {width:  w + 'px', left: leftPos + 'px'}, 'data-dropdown': this.props.dropdown});
        }
    });

    var ScheduleInfo = React.createClass({displayName: 'ScheduleInfo',
        render: function () {
            var AttrTable = pager.components.AttrTable;
            return React.DOM.div({id: this.props._id, className: "f-dropdown medium content", 'data-dropdown-content': true}, 
                React.DOM.table({className: "dropdown-table"}, 
                    React.DOM.tbody(null, 
                        React.DOM.tr(null, 
                            React.DOM.td({colSpan: 2}, 
                                React.DOM.strong(null, this.props.task.address.address)
                            )
                        ), 
                        React.DOM.tr(null, 
                            React.DOM.td(null, 
                                React.DOM.i({className: "f-ico fi-clock"}), 
                                React.DOM.strong(null, "Deslocamento")
                            ), 
                            React.DOM.td(null, 
                                strftime('%H:%M', new Date(this.props.task.directions.schedule.ini)) +
                                    '   <>   ' + strftime('%H:%M', new Date(this.props.task.directions.schedule.end))
                            )
                        ), 
                        React.DOM.tr(null, 
                            React.DOM.td(null, 
                                React.DOM.i({className: "f-ico fi-map"}), 
                                React.DOM.strong(null, "Deslocamento")
                            ), 
                            React.DOM.td(null, this.props.task.directions.distance.text + '   •   ' + this.props.task.directions.duration.text)
                        ), 
                        React.DOM.tr(null, 
                            React.DOM.td(null, 
                                React.DOM.i({className: "f-ico fi-clock"}), 
                                React.DOM.strong(null, "Execução")
                            ), 
                            React.DOM.td(null, strftime('%H:%M', new Date(this.props.task.schedule.ini)) +
                                    '   <>   ' + strftime('%H:%M', new Date(this.props.task.schedule.end)))
                        )
                    )
                ), 
                this.props.task.work_orders.map(function(wo){
                    return AttrTable({key: wo._id, attrs: wo.attrs});
                })
            );
        }
    });

    ScheduleTimeLine = React.createClass({displayName: 'ScheduleTimeLine',
        getInitialState: function () {
            return {id: Math.random().toString(36).substr(2)};
        },
        componentDidMount: function () {
            this.updateDropDown();
        },
        removeDropDown: function () {
            this.props.tasks.forEach(function (task, index) {
                $('#info' + this.props._id + task.addressPlusTargetIDSHA1).remove();
            }.bind(this));
        },
        componentDidUpdate: function () {
            this.updateDropDown();
        },
        updateDropDown: function () {
            this.props.tasks.forEach(function (task, index) {

                var id = 'info' + this.props._id + task.addressPlusTargetIDSHA1,
                    $content = $(React.renderComponentToStaticMarkup(ScheduleInfo({_id: id, task: task}))),
                    $old = $('#' + id);

                if ($old.length) {
                    $old.html($content.html());
                } else {
                    $content.appendTo('body');
                }

            }.bind(this));
        },
        componentWillUnmount: function () {
            this.removeDropDown();
        },
        render: function () {
            return React.DOM.div({className: "panel scheduleTimeLine"}, 
                React.DOM.div(null, 
                    
                        this.props.tasks.map(function (task, index) {
                            return (
                                ScheduleTask({
                                        key: 't-' + task.addressPlusTargetIDSHA1, task: task, index: index, 
                                        dropdown: 'info' + this.props._id+ task.addressPlusTargetIDSHA1, 
                                        microSecondWidth: this.props.microSecondWidth, 
                                        timelineBoundaries: this.props.timelineBoundaries})
                            );
                        }.bind(this))
                    

                )
            );
        }
    });

    var ScheduleRowMenu = React.createClass({displayName: 'ScheduleRowMenu',
        render: function () {
            return React.DOM.ul({id: this.props._id, className: "f-dropdown", 'data-dropdown-content': true}, 
                React.DOM.li(null, React.DOM.a({'data-doempty': true}, "Limpar")), 
                React.DOM.li(null, React.DOM.a({'data-doremove': true}, "Remover"))
            )
        }
    });

    ScheduleRow = React.createClass({displayName: 'ScheduleRow',

        emptySchedule: function () {
            $.ajax({
                type: 'DELETE',
                url: pager.urls.ajax + 'console/schedule/' + this.props.schedule._id + '/tasks'
            }).done(this.props.updateSchedule);
        },

        removeSchedule: function () {
            $.ajax({
                type: 'DELETE',
                url: pager.urls.ajax + 'console/schedule/' + this.props.schedule._id
            }).done(this.props.updateSchedule);
        },
        componentWillUnmount: function () {
            $('#Menu' + this.props.schedule._id).remove();
        },
        componentDidMount: function () {
            var id = 'Menu' + this.props.schedule._id, $content, $old = $(id);

            if ($old.length) return;

            $content = $(React.renderComponentToStaticMarkup(ScheduleRowMenu({_id: id}))).appendTo('body');

            $content.find('[data-doempty]').click(this.emptySchedule);
            $content.find('[data-doremove]').click(this.removeSchedule);

            $(this.getDOMNode()).foundation();
        },
        render: function () {
            return React.DOM.div({className: "scheduleRow"}, 
                
                React.DOM.div({className: "scheduleLabels"}, 
                    React.DOM.span({className: "success label"}, this.props.schedule.worker.name), 
                    React.DOM.a({className: "secondary label fi-widget", title: "Menu", 'data-dropdown': 'Menu' + this.props.schedule._id})
                ), 

                ScheduleTimeLine({tasks: this.props.schedule.tasks, _id: this.props.schedule.worker._id, 
                        microSecondWidth: this.props.microSecondWidth, 
                        timelineBoundaries: this.props.timelineBoundaries})

            )
        }
    });

    var ScheduleHeader = React.createClass({displayName: 'ScheduleHeader',
        render: function () {
            var pxStep = 100,
                timeStep = (pxStep / this.props.microSecondWidth),
                ini = this.props.timelineBoundaries.ini.getTime(),
                ticks = _.range(ini, this.props.timelineBoundaries.end.getTime(), timeStep);

            return React.DOM.div({id: "ScheduleHeader"}, 
                
                    ticks.map(function (tick, index) {
                        var txt = strftime('%H:%M', new Date(tick));
                        return React.DOM.span({className: "scheduleHeaderTick", style: {left: index * pxStep}, key: txt}, 
                            txt);
                    }.bind(this))
                
            );
        }
    });

    ScheduleView = React.createClass({displayName: 'ScheduleView',
        getInitialState: function () {
            return {microSecondWidth: null};
        },
        calcDimensions: function (props) {

            if (!this.isMounted()) return ;

            props = props || this.props;

            var containerWidth = $(this.refs.container.getDOMNode()).width(),
                timelineBoundaries = {ini: Infinity, end: -Infinity},
                maxLength = -Infinity,
                microSecondWidth;

            _.forEach(props.schedule, function (s) {
                
                maxLength = Math.max(s.tasks.length, maxLength);

                _.forEach(s.tasks, function (t) {
                    
                    var a = new Date(t.directions.schedule.ini), z = new Date(t.schedule.end);
                    
                    if (a < timelineBoundaries.ini) timelineBoundaries.ini = a;
                    if (z > timelineBoundaries.end) timelineBoundaries.end = z;

                });
            });

            if (timelineBoundaries.ini === Infinity) {
                timelineBoundaries.ini = new Date(this.props.day);
                timelineBoundaries.ini.setHours(8);
            }
            if (timelineBoundaries.end === -Infinity) {
                timelineBoundaries.end = new Date(this.props.day);
                timelineBoundaries.end.setHours(16)
            }

            microSecondWidth = (containerWidth - (5 * maxLength)) /
                                    (timelineBoundaries.end.getTime() - timelineBoundaries.ini.getTime());
            
            this.setState({microSecondWidth: microSecondWidth, timelineBoundaries: timelineBoundaries});

        },
        componentWillReceiveProps: function (newProps) {
            this.calcDimensions(newProps);
        },
        componentDidMount: function () {
            this.calcDimensions();
        },
        syncSchedules: function () {
            this.props.updateSchedule();
            this.props.syncQueries();
        },
        render: function () {
            return React.DOM.div({id: "Schedule"}, 
                React.DOM.div({id: "ScheduleContainer", ref: "container"}, 
                    this.state.microSecondWidth !== null
                        ? ScheduleHeader({microSecondWidth: this.state.microSecondWidth, timelineBoundaries: this.state.timelineBoundaries})
                        :null, 
                        

                    this.state.microSecondWidth !== null
                        ?
                            this.props.schedule.map(function (schedule) {
                                return ScheduleRow({key: schedule._id, 
                                            updateSchedule: this.syncSchedules, 
                                            schedule: schedule, 
                                            microSecondWidth: this.state.microSecondWidth, 
                                            timelineBoundaries: this.state.timelineBoundaries});
                            }.bind(this))

                        : React.DOM.p(null, "...")
                    

                )
            )
        }
    });

    return ScheduleView;
});