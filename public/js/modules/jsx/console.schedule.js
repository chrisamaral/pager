/** @jsx React.DOM */
define(['../ext/strftime'], function (strftime) {
    var ScheduleView, ScheduleRow, ScheduleTimeLine, ScheduleTask;

    ScheduleTask = React.createClass({
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
            return $('#' + this.infoElemID(props));
        },
        
        infoElemID: function (props) {
            props = props || this.props;
            return 'info' + props.scheduleID + props.task.fakeID;
        },

        componentWillReceiveProps: function (props) {
            var $dropdown = this.dropdownContainer();
            if ($dropdown.length && $dropdown.is('.open')) {
                this.renderDropDown(props);
            }
        },

        moveSchedule: function () {
            $(this.getDOMNode()).trigger("click");

            if (this.props.isSelected) return this.props.startScheduleMover(null);

            this.props.startScheduleMover({
                task: _.cloneDeep(this.props.task),
                schedule: this.props.scheduleID
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

        renderDropDown: function (props) {
            props = props || this.props;

            var task = props.task,
                isSelected = props.isSelected;

            var id = this.infoElemID(props),
                $container = this.dropdownContainer(props);

            if (!$container.length) {
                $container = $(React.renderComponentToStaticMarkup(
                    <SInfoContainer elemID={id} task={task} />)).appendTo('body');
            }

            React.renderComponent(<ScheduleInfo task={task} isSelected={isSelected}
                removeSchedule={this.removeSchedule} moveSchedule={this.moveSchedule} />, $container[0]);

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

            return <div className={classes} onClick={this.showDropDown}
                    style={{width:  w + 'px', left: leftPos + 'px'}}
                    data-dropdown={this.props.dropdown} />;
        }
    });

    var ScheduleControls = React.createClass({
        render: function () {
            var isSelected = this.props.isSelected;
            var moveClasses = React.addons.classSet({tiny: true, button: true, secondary: isSelected});

            return <div className='text-right'>
                <button onClick={this.props.moveSchedule} className={moveClasses}>{isSelected ? 'Cancelar' : 'Mover'}</button>
                <button onClick={this.props.removeSchedule} className='tiny button alert'>Remover</button>
            </div>;
        }
    });
    var ScheduleInfoHeader = React.createClass({

        render: function () {
            return <table className='dropdown-table'>
                <tbody>
                    <tr>
                        <td colSpan={2}>
                            <strong>{this.props.task.address.address}</strong>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <i className='f-ico fi-clock'></i>
                            <strong>Deslocamento</strong>
                        </td>
                        <td>
                                {strftime('%H:%M', new Date(this.props.task.directions.schedule.ini)) +
                                    '   <>   ' + strftime('%H:%M', new Date(this.props.task.directions.schedule.end))}
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <i className='f-ico fi-map'></i>
                            <strong>Deslocamento</strong>
                        </td>
                        <td>{this.props.task.directions.distance.text + '   •   ' + this.props.task.directions.duration.text}</td>
                    </tr>
                    <tr>
                        <td>
                            <i className='f-ico fi-clock'></i>
                            <strong>Execução</strong>
                        </td>
                        <td>{strftime('%H:%M', new Date(this.props.task.schedule.ini)) +
                            '   <>   ' + strftime('%H:%M', new Date(this.props.task.schedule.end))}</td>
                    </tr>
                    <tr><td colSpan={2}>
                        <ScheduleControls removeSchedule={this.props.removeSchedule} moveSchedule={this.props.moveSchedule} isSelected={this.props.isSelected} />
                    </td></tr>
                </tbody>
            </table>;
        }
    });

    var ScheduleInfo = React.createClass({
        render: function () {
            var AttrTable = pager.components.AttrTable;

            return <div>

                <ScheduleInfoHeader task={this.props.task}
                            isSelected={this.props.isSelected}
                            moveSchedule={this.props.moveSchedule} removeSchedule={this.props.removeSchedule} />

                {this.props.task.work_orders.map(function (wo) {
                    return <AttrTable key={wo._id} attrs={wo.attrs} collapsed={true} />;
                })}

            </div>;
        }
    });

    var SInfoContainer = React.createClass({
        render: function () {
            return <div id={this.props.elemID} className='f-dropdown medium content' data-dropdown-content></div>;
        }
    });

    ScheduleTimeLine = React.createClass({

        render: function () {
            var isSelected = this.props.selectedSchedule && this.props.selectedSchedule.schedule === this.props.scheduleID;
            var classes = React.addons.classSet({panel: true, scheduleTimeLine: true, selected: isSelected});

            return <div className={classes}>
                <div>
                    {
                        this.props.tasks.map(function (task, index) {
                            
                            var selected = this.props.selectedSchedule, isSelected = false;
                            if (selected) {
                                isSelected = task.fakeID === selected.task.fakeID
                                    && selected.schedule === this.props.scheduleID
                            }
                            
                            return (
                                <ScheduleTask
                                        scheduleID={this.props.scheduleID}
                                        key={'t-' + task.fakeID} task={task} index={index}
                                        dropdown={'info' + this.props.scheduleID+ task.fakeID}
                                        isSelected={isSelected}
                                        startScheduleMover={this.props.startScheduleMover}
                                        microSecondWidth={this.props.microSecondWidth} 
                                        timelineBoundaries={this.props.timelineBoundaries} />
                            );
                        }.bind(this))
                    }

                </div>
            </div>;
        }
    });

    var ScheduleRowMenu = React.createClass({
        render: function () {
            return <ul id={this.props.elemID} className='f-dropdown' data-dropdown-content>
                <li><a data-doempty>Limpar</a></li>
                <li><a data-doremove>Remover</a></li>
            </ul>
        }
    });

    ScheduleRow = React.createClass({

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

            $content = $(React.renderComponentToStaticMarkup(<ScheduleRowMenu elemID={id} />)).appendTo('body');

            $content.find('[data-doempty]').click(this.emptySchedule);
            $content.find('[data-doremove]').click(this.removeSchedule);

            $(this.getDOMNode()).foundation();
        },
        render: function () {

            return <div className='scheduleRow'>
                
                <div className='scheduleLabels'>
                    <span className='success label'>{this.props.schedule.worker.name}</span>
                    <a className='secondary label fi-widget' title='Menu' data-dropdown={'Menu' + this.props.schedule._id}></a>
                </div>

                <ScheduleTimeLine tasks={this.props.schedule.tasks}  scheduleID={this.props.schedule._id}
                        startScheduleMover={this.props.startScheduleMover}
                        selectedSchedule={this.props.selectedSchedule}
                        microSecondWidth={this.props.microSecondWidth} 
                        timelineBoundaries={this.props.timelineBoundaries}  />

            </div>
        }
    });

    var ScheduleHeader = React.createClass({
        render: function () {
            var pxStep = 100,
                timeStep = (pxStep / this.props.microSecondWidth),
                ini = this.props.timelineBoundaries.ini.getTime(),
                ticks = _.range(ini, this.props.timelineBoundaries.end.getTime(), timeStep);

            return <div id='ScheduleHeader'>
                {
                    ticks.map(function (tick, index) {
                        var txt = strftime('%H:%M', new Date(tick));
                        return <span className='scheduleHeaderTick' style={{left: index * pxStep}} key={txt}>
                            {txt}</span>;
                    }.bind(this))
                }
            </div>;
        }
    });

    ScheduleView = React.createClass({
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
            var schedules = this.props.schedule, selected = this.props.selectedSchedule, found;
            if (selected) {
                found = _.findIndex(schedules, {_id: selected.schedule});
                if (found > -1) {
                    schedules = schedules.concat();
                    found = schedules.splice(found, 1);
                    schedules = found.concat(schedules);
                }
            }
            return <div id='Schedule'>
                <div id='ScheduleContainer' ref='container'>
                    {this.state.microSecondWidth !== null
                        ? <ScheduleHeader microSecondWidth={this.state.microSecondWidth} timelineBoundaries={this.state.timelineBoundaries} />
                        :null
                        }

                    {this.state.microSecondWidth !== null
                        ?
                            schedules.map(function (schedule) {
                                return <ScheduleRow key={schedule._id}
                                            selectedSchedule={this.props.selectedSchedule}
                                            startScheduleMover={this.startScheduleMover}
                                            updateSchedule={this.syncSchedules}
                                            schedule={schedule} 
                                            microSecondWidth={this.state.microSecondWidth}
                                            timelineBoundaries={this.state.timelineBoundaries} />;
                            }.bind(this))

                        : <p>...</p>
                    }

                </div>
            </div>
        }
    });

    return ScheduleView;
});