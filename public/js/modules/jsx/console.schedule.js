/** @jsx React.DOM */
define(['../ext/strftime'], function (strftime) {
    var ScheduleView, ScheduleRow, ScheduleTimeLine, ScheduleTask;

    ScheduleTask = React.createClass({

        render: function () {
            var w, myIni, leftPos;

            w = (this.props.task.duration + (this.props.task.directions.duration.value * 1000)) * this.props.microSecondWidth;
            myIni = new Date(this.props.task.directions.schedule.ini);
            leftPos = (myIni.getTime() - this.props.timelineBoundaries.ini.getTime()) * this.props.microSecondWidth;

            leftPos += this.props.index * 3;

            return <div className='scheduleTask' style={{width:  w + 'px', left: leftPos + 'px'}} data-dropdown={this.props.dropdown} />;
        }
    });

    var ScheduleInfo = React.createClass({
        render: function () {
            var AttrTable = pager.components.AttrTable;
            return <div id={this.props._id} className='f-dropdown medium content' data-dropdown-content>
                <table className='dropdown-table'>
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
                    </tbody>
                </table>
                {this.props.task.work_orders.map(function(wo){
                    return <AttrTable key={wo._id} attrs={wo.attrs} />;
                })}
            </div>;
        }
    });

    ScheduleTimeLine = React.createClass({
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
                    $content = $(React.renderComponentToStaticMarkup(<ScheduleInfo _id={id} task={task} />)),
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
            return <div className='panel scheduleTimeLine'>
                <div>
                    {
                        this.props.tasks.map(function (task, index) {
                            return (
                                <ScheduleTask
                                        key={'t-' + task.addressPlusTargetIDSHA1} task={task} index={index}
                                        dropdown={'info' + this.props._id+ task.addressPlusTargetIDSHA1}
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
            return <ul id={this.props._id} className='f-dropdown' data-dropdown-content>
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

            $content = $(React.renderComponentToStaticMarkup(<ScheduleRowMenu _id={id} />)).appendTo('body');

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

                <ScheduleTimeLine tasks={this.props.schedule.tasks}  _id={this.props.schedule.worker._id}
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
        render: function () {
            return <div id='Schedule'>
                <div id='ScheduleContainer' ref='container'>
                    {this.state.microSecondWidth !== null
                        ? <ScheduleHeader microSecondWidth={this.state.microSecondWidth} timelineBoundaries={this.state.timelineBoundaries} />
                        :null
                        }

                    {this.state.microSecondWidth !== null
                        ?
                            this.props.schedule.map(function (schedule) {
                                return <ScheduleRow key={schedule._id}
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