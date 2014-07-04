/** @jsx React.DOM */
define(['../helpers/utils', '../ext/strftime'], function (utils, strftime) {
    var ScheduleView, ScheduleRow, ScheduleTimeLine, ScheduleTask;
    
    ScheduleTask = React.createClass({
        render: function () {
            var w, myIni, leftPos;
            
            w = (this.props.task.duration + ( this.props.task.directions.duration.value * 1000)) * this.props.microSecondWidth;
            myIni = new Date(this.props.task.directions.schedule.ini);
            leftPos = (myIni.getTime() - this.props.timelineBoundaries.ini.getTime()) * this.props.microSecondWidth;
            
            leftPos += this.props.index * 3;

            return <div className='scheduleTask' style={{width:  w + 'px', left: leftPos + 'px'}}>

            </div>;
        }
    });

    ScheduleTimeLine = React.createClass({
        render: function () {
            return <div className='panel scheduleTimeLine'>
                <div>
                    {
                        this.props.tasks.map(function (task, index) {
                            return <ScheduleTask 
                                        key={task.task} task={task} index={index}
                                        microSecondWidth={this.props.microSecondWidth} 
                                        timelineBoundaries={this.props.timelineBoundaries} />;
                        }.bind(this))
                    }
                </div>
            </div>;
        }
    });

    ScheduleRow = React.createClass({
        render: function () {
            return <div className='scheduleRow'>
                
                <div className='scheduleLabels'>
                    <span className='success label'>{this.props.schedule.name}</span>
                </div>

                <ScheduleTimeLine tasks={this.props.schedule.tasks} 
                        microSecondWidth={this.props.microSecondWidth} 
                        timelineBoundaries={this.props.timelineBoundaries}  />

            </div>
        }
    });

    ScheduleView = React.createClass({
        getInitialState: function () {
            return {microSecondWidth: null};
        },
        calcDimensions: function () {
            if (!this.isMounted()) return ;
            var containerWidth = $(this.refs.container.getDOMNode()).width(),
                timelineBoundaries = {ini: Infinity, end: -Infinity},
                maxLength = -Infinity, calcWidth,
                microSecondWidth;

            _.forEach(this.props.schedule, function (s) {
                
                maxLength = Math.max(s.tasks.length, maxLength);

                _.forEach(s.tasks, function (t) {
                    
                    var a = new Date(t.directions.schedule.ini), z = new Date(t.schedule.end);
                    
                    a < timelineBoundaries.ini && (timelineBoundaries.ini = a);
                    z > timelineBoundaries.end && (timelineBoundaries.end = z);

                });
            });

            microSecondWidth = (containerWidth - (5 * maxLength)) / (timelineBoundaries.end.getTime() - timelineBoundaries.ini.getTime());
            //calcWidth = (timelineBoundaries.end.getTime() - timelineBoundaries.ini.getTime()) * microSecondWidth + (5 * maxLength);
            this.setState({microSecondWidth: microSecondWidth, timelineBoundaries: timelineBoundaries});
        },
        
        componentDidUpdate: function () {  
            setTimeout(this.calcDimensions, 300);
        },
        componentDidMount: function () {
            setTimeout(this.calcDimensions, 300);
        },

        render: function () {
            return <div id='Schedule'>
                <div id='ScheduleContainer' ref='container'>
                    {this.state.microSecondWidth !== null
                        ?
                            this.props.schedule.map(function (schedule) {
                                return <ScheduleRow key={schedule._id} 
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