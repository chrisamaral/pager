define(function(){function f(a){var b=new Date;if(_.isString(a))return new Date(a);_.isNumber(a)&&b.setTime(a);return _.isDate(a)?b.setTime(a.getTime()):b}var d,e;e=React.createClass({displayName:"SubTask",getInitialState:function(){return{obsError:!1}},render:function(){var a=React.addons.classSet({error:this.state.obsError,"default-textarea":!0}),b=pager.components.AttrTable;return React.DOM.div({className:"panel sequential"},b({attrs:this.props.task.attrs}),React.DOM.form(null,React.DOM.textarea({className:a,
placeholder:"Observa\u00e7\u00e3o",name:"obs"}),this.state.obsError?React.DOM.small({className:"error"},"Campo necess\u00e1rio"):null,React.DOM.div({className:"text-right"},React.DOM.button({className:"tiny alert button",type:"submit"},"Rejeitar"),React.DOM.button({className:"tiny success button",type:"submit"},"Aceitar"))))}});PicSlide=React.createClass({displayName:"PicSlide",componentDidMount:function(){$(this.getDOMNode()).foundation();$(document.body).on("open.clearing.fndtn",function(a){console.info("About to open thumbnail with src ",
$("img",a.target).attr("src"))})},render:function(){return React.DOM.div({className:"panel"},React.DOM.ul({className:"clearing-thumbs oksized-thumbs","data-clearing":!0},this.props.pics.map(function(a,b){var c=a&&a.src?a:{src:a};return React.DOM.li({className:"panel radio",key:b},React.DOM.a({href:c.src},c.descr?React.DOM.img({"data-caption":c.descr,src:c.src}):React.DOM.img({src:c.src})))})))}});d=React.createClass({displayName:"TaskPendingApproval",getInitialState:function(){return{infoShown:!1}},
toggleStuff:function(){this.setState({infoShown:!this.state.infoShown})},render:function(){var a=this.props.item,b=pager.components.UserLink,c=pager.components.ObjectLink,d=React.addons.classSet({"activity-full":!0,panel:!0,contained:!0,hide:!this.state.infoShown}),g=f(a.timestamp),h=pager.components.AttrTable;return React.DOM.div({className:"activity-item panel"},React.DOM.span({className:"activity-timestamp"},g),React.DOM.div({className:"activity-header"},React.DOM.div({className:"activity-avatar"},
React.DOM.img({src:a.subject.avatar.thumb})),React.DOM.div({className:"activity-summary"},b({user:a.subject}),React.DOM.span(null," "+a.predicate+" "),c({object:a.object}))),a.pics&&a.pics.length?PicSlide({pics:a.pics}):null,React.DOM.div({className:d},h({attrs:a.attrs}),a.tasks.map(function(a){return e({key:a.id,task:a})})),React.DOM.div({className:"activity-footer"},React.DOM.button({className:"tiny secondary button",onClick:this.toggleStuff},this.state.infoShown?"menos":"mais")))}});return React.createClass({displayName:"Queue",
render:function(){return React.DOM.div({id:"Queue"},React.DOM.h4(null,"Ordens Pendentes"),React.DOM.div({className:"activity-feed"},_.isArray(this.props.items)?this.props.items.map(function(a){return d({item:a,key:a.id})}):null))}})});