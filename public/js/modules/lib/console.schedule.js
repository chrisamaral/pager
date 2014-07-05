/** @jsx React.DOM */
define(['../helpers/utils', '../ext/strftime'], function (utils, strftime) {
    var ScheduleView, ScheduleRow, ScheduleTimeLine, ScheduleTask;

    ScheduleTask = React.createClass({displayName: 'ScheduleTask',
        render: function () {
            var w, myIni, leftPos;

            w = (this.props.task.duration + (this.props.task.directions.duration.value * 1000)) * this.props.microSecondWidth;
            myIni = new Date(this.props.task.directions.schedule.ini);
            leftPos = (myIni.getTime() - this.props.timelineBoundaries.ini.getTime()) * this.props.microSecondWidth;

            leftPos += this.props.index * 3;

            return React.DOM.div( {className:"scheduleTask", style:{width:  w + 'px', left: leftPos + 'px'}}

            );
        }
    });

    ScheduleTimeLine = React.createClass({displayName: 'ScheduleTimeLine',
        render: function () {
            return React.DOM.div( {className:"panel scheduleTimeLine"}, 
                React.DOM.div(null, 
                    
                        this.props.tasks.map(function (task, index) {
                            return ScheduleTask( 
                                        {key:task.task, task:task, index:index,
                                        microSecondWidth:this.props.microSecondWidth, 
                                        timelineBoundaries:this.props.timelineBoundaries} );
                        }.bind(this))
                    
                )
            );
        }
    });

    ScheduleRow = React.createClass({displayName: 'ScheduleRow',
        render: function () {
            return React.DOM.div( {className:"scheduleRow"}, 
                
                React.DOM.div( {className:"scheduleLabels"}, 
                    React.DOM.span( {className:"success label"}, this.props.schedule.name)
                ),

                ScheduleTimeLine( {tasks:this.props.schedule.tasks, 
                        microSecondWidth:this.props.microSecondWidth, 
                        timelineBoundaries:this.props.timelineBoundaries}  )

            )
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
                maxLength = -Infinity, calcWidth,
                microSecondWidth;

            _.forEach(props.schedule, function (s) {
                
                maxLength = Math.max(s.tasks.length, maxLength);

                _.forEach(s.tasks, function (t) {
                    
                    var a = new Date(t.directions.schedule.ini), z = new Date(t.schedule.end);
                    
                    if (a < timelineBoundaries.ini) timelineBoundaries.ini = a;
                    if (z > timelineBoundaries.end) timelineBoundaries.end = z;

                });
            });

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

        render: function () {
            return React.DOM.div( {id:"Schedule"}, 
                React.DOM.div( {id:"ScheduleContainer", ref:"container"}, 
                    this.state.microSecondWidth !== null
                        ?
                            this.props.schedule.map(function (schedule) {
                                return ScheduleRow( {key:schedule._id, 
                                            schedule:schedule, 
                                            microSecondWidth:this.state.microSecondWidth,
                                            timelineBoundaries:this.state.timelineBoundaries} );
                            }.bind(this))

                        : React.DOM.p(null, "...")
                    
                )
            )
        }
    });

    return ScheduleView;
});