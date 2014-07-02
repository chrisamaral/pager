define("../ext/aviator/main ./console.queue ./console.tasks ./console.map ../helpers/utils.js ../ext/strftime".split(" "),function(k,x,y,z,A,f){function e(){this.data={};this.state={hasGoogleMaps:!1,mapState:"tasks"};this.rootComponent=null}var l,m,n,p,q,r,s,h,g,t,u,v;LazyLoad.css(["/css/console.css"]);g=React.createClass({displayName:"UserLink",render:function(){return this.props.user.url?React.DOM.a({target:"_blank",title:this.props.user.full_name,href:this.props.user.url},this.props.user.short_name):
React.DOM.strong({title:this.props.user.full_name},this.props.user.short_name)}});v=React.createClass({displayName:"ObjectLink",render:function(){return React.DOM.span(null,this.props.object.adj?" "+this.props.object.adj:null,React.DOM.span(null," "),this.props.object.url?React.DOM.a({target:"_blank",href:this.props.object.url},this.props.object.name):React.DOM.strong(null,this.props.object.name))}});u=React.createClass({displayName:"AttrItem",toggleTb:function(){$(this.getDOMNode()).closest("table").find("tbody>tr").not(".main-attr").toggle()},
render:function(){var a=this.props.attr,b=React.addons.classSet({"main-attr":3===a.relevance,"important-attr":2===a.relevance}),d=3===a.relevance&&_.isString(a.value)?a.value.toUpperCase():a.value,c=3!==a.relevance&&a.descr;return React.DOM.tr({className:b,onClick:3===a.relevance?this.toggleTb:null},c?React.DOM.td(null,a.descr):null,React.DOM.td({colSpan:3!==a.relevance&&c?1:2,title:!c&&a.descr?a.descr:""},a.url?React.DOM.a({href:a.url,target:"_blank"},d):d))}});t=React.createClass({displayName:"AttrTable",
render:function(){var a=_.filter(this.props.attrs,{relevance:3}).concat(_.filter(this.props.attrs,{relevance:2})).concat(_.filter(this.props.attrs,function(a){return!a.relevance||1>=a.relevance}));return React.DOM.table({className:"attr-table"},React.DOM.tbody(null,a.map(function(a,d){return u({key:d,attr:a})})))}});p=React.createClass({displayName:"RouterWorker",drawMe:function(){this.props.drawWorkerDirections(this.props.worker._id)},render:function(){return React.DOM.li({key:this.props.worker._id},
React.DOM.a({onClick:this.drawMe},this.props.worker.name))}});n=React.createClass({displayName:"RouterWorkers",drawWorkerDirections:function(a){this.props.workers.forEach(function(b){b._id===a&&b.drawDirections()?this.props.toggleRouterMode(b._id,b.tasks.map(function(a){if(a.schedule){var c=[{relevance:3,value:b.name},{descr:"Tipos",value:_.uniq(a.types).join(", ")},{descr:"Deslocamento",value:f("%H:%M",a.directions.schedule.ini)+" < "+a.directions.duration.text+" - "+a.directions.distance.text+" > "+
f("%H:%M",a.directions.schedule.end)},{descr:"Execu\u00e7\u00e3o",value:f("%H:%M",a.schedule.ini)+" < "+Math.floor(a.duration/1E3/60)+"min > "+f("%H:%M",a.schedule.end)},{descr:"Dura\u00e7\u00e3o",value:Math.floor(a.duration/1E3/60)+"min"}],w=_.map(a.tasks,"_id");a.schedule.from&&a.schedule.to&&(!_.isDate(a.schedule.from)&&(a.schedule.from=new Date(a.schedule.from)),!_.isDate(a.schedule.to)&&(a.schedule.to=new Date(a.schedule.to)),c.push({descr:"Agenda",value:f("%d/%m/%Y",a.schedule.from)}),c.push({descr:"Turno",
value:f("%H:%M",a.schedule.from)+" <> "+f("%H:%M",a.schedule.to)}));w.length&&c.push({descr:"ID",value:w.join(", ")});a.target&&c.push({descr:"Cliente",value:a.target.name,relevance:2});c.push({value:a.address.address});return{id:"wRTask-"+a.id,worker:b.name,location:a.location,attrs:c}}})):(b._id!==a&&b.cleanDirections(),b._id===a&&this.props.toggleRouterMode(null))}.bind(this))},render:function(){return React.DOM.div({id:"RouterWorkers"},React.DOM.ul(null,this.props.workers.map(function(a){return p({drawWorkerDirections:this.drawWorkerDirections,
key:a._id,worker:a})}.bind(this))))}});m=React.createClass({displayName:"RouterController",getInitialState:function(){return{messages:[],workers:[],day:this.props.router._day}},componentDidMount:function(){this.props.router.progress(function(a,b){if(this.isMounted())switch(a){case "message":this.state.messages.push(b),this.setState({messages:this.state.messages})}}.bind(this));this.props.router.done(function(a){this.isMounted()&&this.setState({workers:a})}.bind(this));this.props.router.fail(function(){this.isMounted()&&
this.props.cancelRoute()}.bind(this))},cancel:function(){this.state.workers.forEach(function(a){a.cleanDirections()});this.props.cancelRoute()},save:function(){this.state.workers.forEach(function(a){a.cleanDirections()});this.props.saveRoute(this.state.workers,this.state.day)},render:function(){return React.DOM.div({id:"Router",className:"leftMapControl"},React.DOM.div({className:"controlIco"},React.DOM.i({className:"fi-page-multiple"})),React.DOM.div({className:"controlContent"},React.DOM.h4(null,
"Roteador"),React.DOM.div({className:"panel contained clearfix"},React.DOM.div({id:"RouterLog"},this.state.messages.map(function(a,b){return React.DOM.p({key:b},a)})),n({workers:this.state.workers,toggleRouterMode:this.props.toggleRouterMode}),React.DOM.div({className:"row"},React.DOM.div({className:"text-right"},React.DOM.button({onClick:this.cancel,className:"tiny alert button"},"Cancelar"),this.state.workers&&this.state.workers.length?React.DOM.button({onClick:this.save,className:"tiny success button"},
"Salvar"):null)))))}});l=React.createClass({displayName:"LeftPanel",componentDidMount:function(){$(this.getDOMNode()).on("click",".controlContent>h4,.controlIco",function(){$(this).closest(".leftMapControl").children(".controlContent,.controlIco").toggle();$("#ScrollRoot").trigger("resize")})},render:function(){return React.DOM.nav({id:"LeftPanel"},React.DOM.div({id:"LeftPanelWrapper"},this.props.pending.length?x({items:this.props.pending,locations:this.props.locations}):null,this.props.router&&m({router:this.props.router,
saveRoute:this.props.saveRoute,cancelRoute:this.props.cancelRoute,toggleRouterMode:this.props.toggleRouterMode}),y({routeTasks:this.props.routeTasks,locations:this.props.locations,day:this.props.day,setTaskFocus:this.props.setTaskFocus,selectedTask:this.props.selectedTask,hasGoogleMaps:this.props.hasGoogleMaps,queries:this.props.queries,setQueries:this.props.setQueries})))}});r=React.createClass({displayName:"RightPanel",componentDidMount:function(){$("#ScrollRoot").on("resize",_.throttle(function(){this.forceUpdate()}.bind(this),
100))},render:function(){return React.DOM.main({id:"RightPanel",style:{width:$("#Console").width()-$("#LeftPanel").width()}},this.props.routerLoader&&React.DOM.div(null,React.DOM.h4(null,"Configura\u00e7\u00f5es de Roteamento"),React.DOM.div({className:"panel"},q({workers:_.map(this.props.workers,function(a){return{_id:a._id,name:a.name,types:a.types}}),onSet:this.props.routerLoader}))))}});s=React.createClass({displayName:"Console",parseArgsToState:function(a){a=a||this.props;var b=a.args.day?a.args.day:
(new Date).toYMD();a=(a=a.args.locations?a.args.locations:[])?_.isString(a)?a:_.isArray(a)?a.join(","):"":"";return{day:b,locations:a}},getInitialState:function(){return this.parseArgsToState()},componentWillReceiveProps:function(a){var b=this.props.args.day!==this.state.day;this.setState(this.parseArgsToState(a),function(){this.updateDefaultQuery(b)}.bind(this))},componentDidMount:function(){this.updateDefaultQuery(!0);this.putArgs();h=_.throttle(function(){this.forceUpdate()}.bind(this),300);$(window).resize(h)},
componentWillUnmount:function(){$(window).off("resize",h)},putArgs:function(){var a=[pager.org.id,"console",this.state.day];this.state.locations.length&&a.push(this.state.locations);a="/"+a.join("/");a!==k.getCurrentURI()&&k.navigate(a)},updateDefaultQuery:function(a){this.props.lib.setDefaultQuery(this.state.day,a)},setQueries:function(a){this.props.lib.set("queries",a)},setTaskFocus:function(a){if(this.props.lib.state.selectedTask===a&&"task"===this.props.lib.state.mapState)return this.props.lib.state.selectedTask=
null,this.props.lib.state.mapState="tasks",this.props.lib.put();this.props.lib.state.mapState="task";this.props.lib.state.selectedTask=a;this.props.lib.put()},setMapState:function(a){this.props.lib.state.mapState=a;"task"!==a&&(this.props.lib.state.selectedTask=void 0);this.props.lib.put()},toggleRouterMode:function(a,b){a?(this.props.lib.state.mapState="router",this.props.lib.state.routerWorker={wayPoints:b}):(this.props.lib.state.mapState="tasks",this.props.lib.state.routerWorker=null);this.props.lib.put()},
killRoute:function(){"router"===this.props.lib.state.mapState&&(this.props.lib.state.mapState="tasks",this.props.lib.state.routerWorker=null);this.props.lib.router.stopRouter();delete this.props.lib.router;this.props.lib.put()},saveRoute:function(a,b){function d(a){var b={address:a.address,location:a.location,directions:a.directions,duration:a.duration,schedule:a.schedule};a.ref&&a.target&&(b[a.ref]=a.target);b.tasks=_.map(a.tasks,function(a){return{task:a._id,attrs:a.attrs,type:a.type}});return b}
var c=_.map(a,function(a){var b={worker:a._id,name:a.name,workShift:a.workShift,tasks:_.map(a.tasks,d)};a.startPoint&&(b.startPoint=a.startPoint);a.endPoint&&(b.endPoint=a.endPoint);return b});$.post(pager.urls.ajax+"console/schedules/"+b,{schedules:JSON.stringify(c)});this.killRoute()},cancelRoute:function(){this.killRoute()},initRouter:function(a){this.props.lib.startRouter(this.state.day,a,this)},render:function(){var a=$(window).height()-$(".tab-bar").outerHeight();return React.DOM.div({id:"Console",
style:{"min-height":a}},this.props.lib.state.hasGoogleMaps?z({queries:this.props.lib.data.queries,setTaskFocus:this.setTaskFocus,routerWorker:this.props.lib.state.routerWorker,mapState:this.props.lib.state.mapState,height:a,setMapState:this.setMapState,selectedTask:this.props.lib.state.selectedTask}):null,l({pending:this.props.lib.data.pending,routeTasks:this.initRouter,queries:this.props.lib.data.queries,toggleRouterMode:this.toggleRouterMode,saveRoute:this.saveRoute,cancelRoute:this.cancelRoute,
day:this.state.day,router:this.props.lib.router,locations:this.state.locations,hasGoogleMaps:this.props.lib.state.hasGoogleMaps,setQueries:this.setQueries,selectedTask:this.props.lib.state.selectedTask,setTaskFocus:this.setTaskFocus}),r({workers:this.props.lib.data.workers,router:this.props.lib.router,totalWidth:$(window).width(),routerLoader:this.props.lib.routerLoader,hasGoogleMaps:this.props.lib.state.hasGoogleMaps}))}});e.prototype.put=function(){Modernizr.localstorage&&(localStorage.setItem("pager."+
pager.org.id+".console.queries",JSON.stringify(this.data.queries.filter(function(a){return"Agenda"!==a.name}).map(function(a){a=_.clone(a);a.tasks=[];return a}))),localStorage.setItem("pager."+pager.org.id+".console.workers",JSON.stringify(this.data.workers)));this.rootComponent.setProps({lib:this})};e.prototype.set=function(a,b){"queries"===a&&(b=b.filter(function(a,b){return"Agenda"===a.name||a.tasks&&a.tasks.length}).map(function(a){a.id=a.id||"query-"+Math.random().toString(36).substr(2);return a}));
this.data[a]=b;this.put()};e.prototype.loadMaps=function(){console.log("loading google maps...");var a=this,b=Math.random().toString(36).substr(2),d=function(){_.delay(function(){console.log("done loading google maps");window["Pager_"+b]&&delete window["Pager_"+b];a.state.hasGoogleMaps=!0;a.put()},500)};if("undefined"!==typeof google&&google.maps)return setTimeout(d,500);A.loadAPIKeys(function(a){window["Pager_"+b]=d;LazyLoad.js(["https://maps.googleapis.com/maps/api/js?v=3.exp&sensor=true&key="+
a.google+"&libraries=geometry&callback=Pager_"+b])}.bind(this))};e.prototype.startRouter=function(a,b,d){if(!this.router){Modernizr.webworkers||alert("Este navegador n\u00e3o suporta as tecnologias necess\u00e1rias para utiliza\u00e7\u00e3o do roteador. Por favor, atualize seu browser e tente novamente.");var c=this;require(["../lib/router","./console.router.cfg"],function(e,f){q=f;d.isMounted()&&(c.routerLoader=function(d){delete c.routerLoader;d&&d.length&&(c.router=new e(a,b,d),c.router._day=a);
c.put()},c.put())})}};e.prototype.setDefaultQuery=function(a,b){if(!pager.isDev){var d={id:"query-"+Math.random().toString(36).substr(2),name:"Agenda",tasks:[],query:{schedule:[a]}},c=_.findIndex(this.data.queries,{name:"Agenda"});if(0<=c){if(this.data.queries[c].query.schedule[0]===d.query.schedule[0])return;this.data.queries[c]=d}else{if(!b)return;this.data.queries.unshift(d)}console.log("update day",a);this.put();this.fetchQueries()}};e.prototype.fetchQueries=function(){this.data.queries.forEach(function(a,
b){$.get(pager.urls.ajax+"console/tasks",a.query).done(function(b){_.isArray(b)&&(a.tasks=b,this.put())}.bind(this))}.bind(this))};e.prototype.fetchWorkers=function(){$.get(pager.urls.ajax+"console/workers").done(function(a){this.set("workers",a)}.bind(this))};e.prototype.fetchPendingOrders=function(){$.get("/json/console.pending.json").done(function(a){if(_.isString(a))try{a=JSON.parse(a)}catch(b){console.log(b),a=[]}this.data.pending=a;this.put()}.bind(this))};e.prototype.init=function(a,b){var d;
this.data={pending:[],queries:[],workers:[]};if(Modernizr.localstorage){try{d=JSON.parse(localStorage.getItem("pager."+pager.org.id+".console.queries"))}catch(c){console.log(c)}this.data.queries=d&&d.length?this.data.queries.concat(d):this.data.queries;try{this.data.workers=JSON.parse(localStorage.getItem("pager."+pager.org.id+".console.workers"))}catch(e){console.log(e)}}this.fetchQueries();this.fetchWorkers();this.rootComponent=a;b(this);this.fetchPendingOrders();this.loadMaps()};_.merge(pager.components,
{UserLink:g,ObjectLink:v,AttrTable:t});g=new e;pager.console=g;return{component:s,librarian:g}});
