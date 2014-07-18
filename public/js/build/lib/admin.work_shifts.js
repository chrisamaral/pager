define(function(){var b=React.createClass({displayName:"ShiftEditor",getInitialState:function(){return{locked:!1}},unlock:function(){this.isMounted()&&this.setState({locked:!1})},handleSubmit:function(a){a.preventDefault();this.state.locked||(a=$(this.getDOMNode()),a=$.post(a.attr("action"),a.serialize()).always(this.unlock),this.setState({locked:!0}),this.props.shift._id||a.done(function(){this.isMounted()&&(this.refs.nameInput.getDOMNode().value=this.props.shift.name,this.refs.fromInput.getDOMNode().value=
this.props.shift.from,this.refs.toInput.getDOMNode().value=this.props.shift.to,this.props.reloadShifts())}.bind(this)))},killMe:function(a){a.preventDefault();a=$(this.getDOMNode());$.ajax({url:a.attr("action"),type:"DELETE"}).done(this.props.reloadShifts)},render:function(){return React.DOM.form({onSubmit:this.handleSubmit,action:pager.urls.ajax+"admin/work_shift"+(this.props.shift._id?"/"+this.props.shift._id:"")},React.DOM.div({className:"row"},React.DOM.div({className:"small-4 columns"},React.DOM.input({required:!0,
type:"text",ref:"nameInput",name:"name",defaultValue:this.props.shift.name})),React.DOM.div({className:"small-3 columns"},React.DOM.input({required:!0,type:"time",ref:"fromInput",name:"from",defaultValue:this.props.shift.from})),React.DOM.div({className:"small-3 columns"},React.DOM.input({required:!0,type:"time",ref:"toInput",name:"to",defaultValue:this.props.shift.to})),React.DOM.div({className:"small-1 columns"},React.DOM.a({onClick:this.handleSubmit,className:"button postfix success"},React.DOM.i({className:"fi-save"}))),
React.DOM.div({className:"small-1 columns"},this.props.shift._id?React.DOM.a({className:"button postfix alert",onClick:this.killMe},React.DOM.i({className:"fi-x"})):null)))}});return React.createClass({displayName:"Shifts",getInitialState:function(){return{shifts:[],defaultShift:{name:"",from:"08:00",to:"17:00"}}},componentDidMount:function(){this.reloadShifts()},reloadShifts:function(){$.get(pager.urls.ajax+"admin/work_shifts").done(function(a){this.isMounted()&&this.setState({shifts:a})}.bind(this))},
render:function(){return React.DOM.div(null,React.DOM.div({className:"row"},React.DOM.div({className:"small-4 columns"},"Nome do Turno"),React.DOM.div({className:"small-3 columns"},"In\u00edcio"),React.DOM.div({className:"small-3 columns"},"Fim"),React.DOM.div({className:"small-2 columns text-center"},"#")),React.DOM.br(null),this.state.shifts.map(function(a){return b({key:a._id,shift:a,reloadShifts:this.reloadShifts})}.bind(this)),b({reloadShifts:this.reloadShifts,shift:this.state.defaultShift}))}})});
