define(["../helpers/utils","../ext/strftime"],function(h,k){var e,f,g;g=React.createClass({displayName:"ScheduleTask",render:function(){var a,b;a=(this.props.task.duration+1E3*this.props.task.directions.duration.value)*this.props.microSecondWidth;b=((new Date(this.props.task.directions.schedule.ini)).getTime()-this.props.timelineBoundaries.ini.getTime())*this.props.microSecondWidth;b+=3*this.props.index;return React.DOM.div({className:"scheduleTask",style:{width:a+"px",left:b+"px"}})}});f=React.createClass({displayName:"ScheduleTimeLine",
render:function(){return React.DOM.div({className:"panel scheduleTimeLine"},React.DOM.div(null,this.props.tasks.map(function(a,b){return g({key:a.addressPlusTargetIDSHA1,task:a,index:b,microSecondWidth:this.props.microSecondWidth,timelineBoundaries:this.props.timelineBoundaries})}.bind(this))))}});e=React.createClass({displayName:"ScheduleRow",render:function(){return React.DOM.div({className:"scheduleRow"},React.DOM.div({className:"scheduleLabels"},React.DOM.span({className:"success label"},this.props.schedule.worker.name)),
f({tasks:this.props.schedule.tasks,microSecondWidth:this.props.microSecondWidth,timelineBoundaries:this.props.timelineBoundaries}))}});return React.createClass({displayName:"ScheduleView",getInitialState:function(){return{microSecondWidth:null}},calcDimensions:function(a){if(this.isMounted()){a=a||this.props;var b=$(this.refs.container.getDOMNode()).width(),c={ini:Infinity,end:-Infinity},d=-Infinity;_.forEach(a.schedule,function(a){d=Math.max(a.tasks.length,d);_.forEach(a.tasks,function(a){var b=
new Date(a.directions.schedule.ini);a=new Date(a.schedule.end);b<c.ini&&(c.ini=b);a>c.end&&(c.end=a)})});a=(b-5*d)/(c.end.getTime()-c.ini.getTime());this.setState({microSecondWidth:a,timelineBoundaries:c})}},componentWillReceiveProps:function(a){this.calcDimensions(a)},componentDidMount:function(){this.calcDimensions()},render:function(){return React.DOM.div({id:"Schedule"},React.DOM.div({id:"ScheduleContainer",ref:"container"},null!==this.state.microSecondWidth?this.props.schedule.map(function(a){return e({key:a._id,
schedule:a,microSecondWidth:this.state.microSecondWidth,timelineBoundaries:this.state.timelineBoundaries})}.bind(this)):React.DOM.p(null,"...")))}})});