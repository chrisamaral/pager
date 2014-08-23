/** @jsx React.DOM */
define(['../ext/strftime'], function (strftime) {
    var ScheduleView, ScheduleRow, ScheduleTimeLine, ScheduleTask;

    ScheduleTask = React.createClass({displayName: 'ScheduleTask',
        getInitialState: function () {
            return {dropdownMounted: false};
        },
        removeSchedule: function () {
            /*
            this.props.removeSchedule({
                task: this.props.task,
                schedule: this.props._id
            });
            */
        },
        dropdownContainer: function (props) {
            return $('#' + this.myID(props));
        },
        myID: function (props) {
            props = props || this.props;
            return 'info' + props._id + props.task.addressPlusTargetIDSHA1;
        },

        componentWillReceiveProps: function (props) {
            var $dropdown = this.dropdownContainer();
            if ($dropdown.length && $dropdown.is('.open')) {
                this.renderDropDown(props);
            }
        },

        moveSchedule: function () {
            if (this.props.isSelected) return this.props.startScheduleMover(null);

            this.props.startScheduleMover({
                task: this.props.task,
                schedule: this.props._id
            });
        },

        removeDropDown: function () {
            var $popup = this.dropdownContainer();
            React.unmountComponentAtNode($popup[0]);
            $popup.remove();
        },

        componentWillUnmount: function () {
            this.removeDropDown();
        },

        renderTo: function (task, id, isSelected, $container) {

            React.renderComponent(ScheduleInfo({_id: id, task: task, 
                isSelected: isSelected, 
                removeSchedule: this.removeSchedule, 
                moveSchedule: this.moveSchedule}), $container[0]);
        },

        renderDropDown: function (props) {
            props = props || this.props;

            var task = props.task,
                isSelected = props.isSelected;

            var id = this.myID(props),
                $container = this.dropdownContainer(props);

            if (!$container.length) {
                $container = $(React.renderComponentToStaticMarkup(SInfoContainer({_id: id, task: task}))).appendTo('body');
            }

            this.renderTo(task, id, isSelected, $container);

            if (!$container.is('.open')) {
                $container.foundation();
                $(this.getDOMNode()).trigger("click");
            }
        },
        showDropDown: function () {
            var $container = this.dropdownContainer();
            if (!$container.length) {
                this.renderDropDown();
                this.setState({dropdownMounted: true});
            }
        },
        render: function () {
            var w, myIni, leftPos,
                classes = React.addons.classSet({
                    scheduleTask: true,
                    decoupled: this.props.isSelected
                });

            w = (this.props.task.duration + (this.props.task.directions.duration.value * 1000)) * this.props.microSecondWidth;
            myIni = new Date(this.props.task.directions.schedule.ini);
            leftPos = (myIni.getTime() - this.props.timelineBoundaries.ini.getTime()) * this.props.microSecondWidth;

            leftPos += this.props.index * 3;

            return React.DOM.div({className: classes, onClick: this.showDropDown, style: {width:  w + 'px', left: leftPos + 'px'}, 'data-dropdown': this.props.dropdown});
        }
    });

    var ScheduleControls = React.createClass({displayName: 'ScheduleControls',
        render: function () {
            var isSelected = this.props.isSelected;
            var moveClasses = React.addons.classSet({tiny: true, button: true, secondary: isSelected});

            return React.DOM.div({className: "text-right"}, 
                React.DOM.button({onClick: this.props.moveSchedule, className: moveClasses}, isSelected ? 'Cancelar' : 'Mover'), 
                React.DOM.button({onClick: this.props.removeSchedule, className: "tiny button alert"}, "Remover")
            );
        }
    });
    var ScheduleInfoHeader = React.createClass({displayName: 'ScheduleInfoHeader',

        render: function () {
            return React.DOM.table({className: "dropdown-table"}, 
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
                    ), 
                    React.DOM.tr(null, React.DOM.td({colSpan: 2}, 
                        ScheduleControls({removeSchedule: this.props.removeSchedule, moveSchedule: this.props.moveSchedule, isSelected: this.props.isSelected})
                    ))
                )
            );
        }
    });
    var ScheduleInfo = React.createClass({displayName: 'ScheduleInfo',
        render: function () {
            var AttrTable = pager.components.AttrTable;

            return React.DOM.div(null, 

                ScheduleInfoHeader({task: this.props.task, 
                            isSelected: this.props.isSelected, 
                            moveSchedule: this.props.moveSchedule, removeSchedule: this.props.removeSchedule}), 

                this.props.task.work_orders.map(function (wo) {
                    return AttrTable({key: wo._id, attrs: wo.attrs, collapsed: true});
                })

            );
        }
    });

    var SInfoContainer = React.createClass({displayName: 'SInfoContainer',
        render: function () {
            return React.DOM.div({id: this.props._id, className: "f-dropdown medium content", 'data-dropdown-content': true});
        }
    });

    ScheduleTimeLine = React.createClass({displayName: 'ScheduleTimeLine',

        render: function () {
            return React.DOM.div({className: "panel scheduleTimeLine"}, 
                React.DOM.div(null, 
                    
                        this.props.tasks.map(function (task, index) {
                            var selected = this.props.selectedSchedule, isSelected = false;
                            if (selected) {
                                isSelected = task.addressPlusTargetIDSHA1 === selected.task.addressPlusTargetIDSHA1
                                    && selected.schedule === this.props._id
                            }
                            return (
                                ScheduleTask({
                                        _id: this.props._id, 
                                        key: 't-' + task.addressPlusTargetIDSHA1, task: task, index: index, 
                                        dropdown: 'info' + this.props._id+ task.addressPlusTargetIDSHA1, 
                                        isSelected: isSelected, 
                                        startScheduleMover: this.props.startScheduleMover, 
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
                        startScheduleMover: this.props.startScheduleMover, 
                        selectedSchedule: this.props.selectedSchedule, 
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
        startScheduleMover: function (task) {
            this.props.setScheduleMover(task);
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
                                            selectedSchedule: this.props.selectedSchedule, 
                                            startScheduleMover: this.startScheduleMover, 
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