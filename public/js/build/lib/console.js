define(["./console.leftpanel", "./console.rightpanel", "./console.map", "../lib/console.component.schedule.js", "../lib/console.component.router.js", "../lib/console.component.map.js", "../lib/console.component.queries.js"],function(n,p,q,e,b,f,c){var g=pager.Aviator,h,k,l,m;LazyLoad.css(["/css/console.css"]);h=React.createClass({displayName:"UserLink",render:function(){return this.props.user.url?React.DOM.a({target:"_blank",title:this.props.user.full_name,href:this.props.user.url},this.props.user.short_name):
React.DOM.strong({title:this.props.user.full_name},this.props.user.short_name)}});m=React.createClass({displayName:"ObjectLink",render:function(){return React.DOM.span(null,this.props.object.adj?" "+this.props.object.adj:null,React.DOM.span(null," "),this.props.object.url?React.DOM.a({target:"_blank",href:this.props.object.url},this.props.object.name):React.DOM.strong(null,this.props.object.name))}});l=React.createClass({displayName:"AttrItem",toggleTb:function(){$(this.getDOMNode()).closest("table").find("tbody>tr").not(".main-attr").toggle()},
render:function(){var a=this.props.attr,r=React.addons.classSet({"main-attr":3===a.relevance,"important-attr":2===a.relevance}),d=3===a.relevance&&_.isString(a.value)?a.value.toUpperCase():a.value,b=3!==a.relevance&&a.descr;return React.DOM.tr({className:r,onClick:3===a.relevance?this.toggleTb:null},b?React.DOM.td(null,a.descr):null,React.DOM.td({colSpan:3!==a.relevance&&b?1:2,title:!b&&a.descr?a.descr:""},a.url?React.DOM.a({href:a.url,target:"_blank"},d):d))}});k=React.createClass({displayName:"AttrTable",
render:function(){var a=_.filter(this.props.attrs,{relevance:3}).concat(_.filter(this.props.attrs,{relevance:2})).concat(_.filter(this.props.attrs,function(a){return!a.relevance||1>=a.relevance}));return React.DOM.table({className:"attr-table"},React.DOM.tbody(null,a.map(function(a,b){return l({key:b,attr:a})})))}});e=React.createClass({displayName:"Console",parseArgsToState:function(a){a=a||this.props;var b=a.args.day?a.args.day:(new Date).toYMD();a=(a=a.args.locations?a.args.locations:[])?_.isString(a)?
a:_.isArray(a)?a.join(","):"":"";return{day:b,locations:a}},getInitialState:function(){var a,b=_.merge(this.parseArgsToState(),{mapState:pager.constant.console.map.AVAILABLE_TASKS,pending:[],queries:[],schedule:[]});if(Modernizr.localstorage){try{a=JSON.parse(localStorage.getItem("pager."+pager.org.id+".console.queries"))}catch(d){console.log(d)}b.queries=a&&a.length?b.queries.concat(a):b.queries}return b},componentWillReceiveProps:function(a){var b=a.args.day&&a.args.day!==this.state.day;this.setState(this.parseArgsToState(a),
function(){if(b){for(var a=this.state.schedule;0<a.length;)a.pop();this.updateSchedule()}this.updateDefaultQuery(b)}.bind(this))},componentDidMount:function(){$("body").css("overflow-y","scroll");this.updateDefaultQuery(!0);this.putArgs();var a=_.throttle(function(){if(!this.isMounted)return $(window).off("resize",a);this.forceUpdate()}.bind(this),300);$(window).on("resize",a);this.updateSchedule(this.syncQueries);this.loadGoogleMaps()},componentWillUnmount:function(){$("body").css("overflow-y","");
clearTimeout(this.updateSchedule.__timeout);clearTimeout(this.syncQueries.__timeout)},putArgs:function(){var a;a="/"+[pager.org.id,"console",this.state.day,this.state.locations].join("/");a!==g.getCurrentURI()&&g.navigate(a)},setTaskFocus:f.setTaskFocus,setMapState:f.setMapState,loadGoogleMaps:f.loadGoogleMaps,updateDefaultQuery:c.updateDefaultQuery,setQueries:c.setQueries,fetchQuery:c.fetchQuery,fetchQueries:c.fetchQueries,syncQueries:c.syncQueries,toggleRouterMode:b.toggleRouterMode,killRoute:b.killRoute,
saveRoute:b.saveRoute,cancelRoute:b.cancelRoute,startRouter:b.startRouter,initRouter:b.initRouter,updateSchedule:e.updateSchedule,render:function(){var a=$(window).height()-$("#MainTopBar").outerHeight();return React.DOM.div({id:"Console",style:{"min-height":a}},this.state.hasGoogleMaps?q({queries:this.state.queries,setTaskFocus:this.setTaskFocus,routerWorker:this.state.routerWorker,mapState:this.state.mapState,height:a,setMapState:this.setMapState,selectedTask:this.state.selectedTask}):null,n({pending:this.state.pending,
routeTasks:this.initRouter,queries:this.state.queries,toggleRouterMode:this.toggleRouterMode,saveRoute:this.saveRoute,cancelRoute:this.cancelRoute,day:this.state.day,router:this.state.router,locations:this.state.locations,hasGoogleMaps:this.state.hasGoogleMaps,setQueries:this.setQueries,selectedTask:this.state.selectedTask,setTaskFocus:this.setTaskFocus}),p({router:this.state.router,updateSchedule:this.updateSchedule,syncQueries:this.syncQueries,schedule:this.state.schedule,day:this.state.day,totalWidth:$(window).width(),
routerLoader:this.state.routerLoader,hasGoogleMaps:this.state.hasGoogleMaps}))}});_.merge(pager.components,{UserLink:h,ObjectLink:m,AttrTable:k});pager.console={};return e});
