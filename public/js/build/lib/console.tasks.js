define(["../helpers/utils","./component.DateInput"],function(r,q){var e,f,g,h,k,l,m,n,p={schedule:"Agenda::Ordem",task_id:"C\u00f3digo::Ordem",creation:"Ingresso::Ordem",task_status:"Status::Ordem",task_type:"Tipo::Ordem",customer_id:"C\u00f3digo::Assinante",customer_name:"Nome::Assinante",address:"Endere\u00e7o::Assinante"};h=React.createClass({displayName:"TxtInput",render:function(){return React.DOM.input({name:this.props.inputName,required:!0,autoComplete:"on",type:"text",defaultValue:"",placeholder:this.props.name})}});
g=React.createClass({displayName:"FilterItem",killFilter:function(a){a.preventDefault();this.props.removeFilter(this.props.key)},render:function(){var a;switch(this.props.id){case "schedule":case "creation":a=q;break;default:a=h}return React.DOM.div({className:"row"},React.DOM.div({className:"large-12 columns text-right"},React.DOM.label(null,React.DOM.strong(null,this.props.name,React.DOM.a({onClick:this.killFilter}," - ")),a({id:this.props.id,name:this.props.name,inputName:this.props.id}))))}});
f=React.createClass({displayName:"FilterList",handleSubmit:function(a){a.preventDefault();a=$(a.currentTarget).serializeArray();var b={};_.forEach(a,function(a){!a||_.isString(a.value)&&!a.value.length||(b[a.name]=b[a.name]||[],b[a.name].push(a.value))});$.get("/"+pager.org.id+"/api/console/tasks",b).done(function(a){_.isArray(a)&&this.props.pushQuery(b,a)}.bind(this))},render:function(){var a=this.props.filters.map(function(a,c){Foundation.utils.random_str(10);return g({key:c,id:a.id,name:a.name,
removeFilter:this.props.removeFilter})}.bind(this));return React.DOM.div({className:"filter-list panel"},React.DOM.form({onSubmit:this.handleSubmit},a,React.DOM.div({className:"row"},React.DOM.div({className:"large-12 columns text-right"},React.DOM.button({type:"submit",className:"tiny success button"},"Buscar")))))}});l=React.createClass({displayName:"QueryInfoDropDown",render:function(){return React.DOM.div({"data-dropdown-content":!0,className:"f-dropdown content medium hide",id:this.props.id},
React.DOM.h4({className:"subheader"},(this.props.count||"Nenhuma")+(1<this.props.count?" ordens":" ordem")),React.DOM.table({className:"queryInfoDropDownTable"},React.DOM.tbody(null,_.map(this.props.query,function(a,b){return React.DOM.tr({key:b},React.DOM.td(null,p[b]),React.DOM.td(null,a.map(function(a,b){return React.DOM.span({key:b,className:"round secondary label"},a)})))}))))}});n=React.createClass({displayName:"QueryTask",killMe:function(){this.props.removeTask(this.props.key)},render:function(){return React.DOM.div({className:"queryTask"},
React.DOM.a({className:"right radius ico fi-x-circle",title:"Remover",onClick:this.killMe}),AttrTable({key:this.props.key,attrs:this.props.task.attrs}))}});m=React.createClass({displayName:"QueryTasks",render:function(){return React.DOM.div(null,this.props.tasks.map(function(a,b){return n({key:b,task:a,removeTask:this.props.removeTask})}.bind(this)))}});k=React.createClass({displayName:"Query",getInitialState:function(){return{visibleTasks:!0,triggedMenu:!1,auxId:"q"+Math.random().toString(36).substr(2)}},
killMe:function(a){a.preventDefault();this.props.popQuery(this.props.key)},componentWillReceiveProps:function(){$("#"+this.state.auxId+"toggleTasks").off("click",this.toggleTasks);$("#"+this.state.auxId+"toggleTasks").click(this.toggleTasks)},componentDidMount:function(){$(this.getDOMNode()).foundation();$("#"+this.state.auxId+"toggleTasks").click(this.toggleTasks);$("#"+this.state.auxId+"killMe").click(this.killMe)},componentDidUpdate:function(){$(this.getDOMNode()).foundation()},removeTask:function(a){var b=
this.props.query.tasks;b.splice(a,1);this.setTasks(b)},setTasks:function(a){var b=this.props.query;b.tasks=a;this.props.setQuery(b,this.props.key)},toggleTasks:function(a){a.preventDefault();this.setState({visibleTasks:!this.state.visibleTasks})},render:function(){var a=0<this.props.query.tasks.length,b=React.addons.classSet({"no-flow-x":!0,hide:a&&!this.state.visibleTasks}),c=0<this.props.key||a;return React.DOM.div({className:"panel queryResult"},React.DOM.h5({className:"clearfix"},this.props.query.name?
this.props.query.name:null,React.DOM.a({"data-options":"is_hover:true",className:"right radius ico fi-info",title:"Informa\u00e7\u00e3o","data-dropdown":this.state.auxId+"Info"}),c&&React.DOM.a({"data-options":"is_hover:true",className:"right radius ico fi-list",title:"Menu","data-dropdown":this.state.auxId+"Menu"})),React.DOM.div({className:b},a?m({tasks:this.props.query.tasks,removeTask:this.removeTask}):null),React.DOM.ul({id:this.state.auxId+"Menu",className:"tiny f-dropdown hide","data-dropdown-content":!0},
a?React.DOM.li(null,React.DOM.a({id:this.state.auxId+"toggleTasks"},this.state.visibleTasks?"Diminuir":"Expandir")):null,0<this.props.key?React.DOM.li(null,React.DOM.a({id:this.state.auxId+"killMe"},"Descartar")):null),l({id:this.state.auxId+"Info",count:this.props.query.tasks.length,query:this.props.query.query}))}});e=React.createClass({displayName:"TaskInput",getInitialState:function(){return{filters:[]}},pushQuery:function(a,b,c){c=this.props.queries;var d={};d.query=a;d.tasks=b;c.push(d);this.props.setQueries(c);
this.setState({filters:[]})},setQuery:function(a,b){var c=this.props.queries;c[b]=a;this.props.setQueries(c)},popQuery:function(a){var b=this.props.queries.concat();b.splice(a,1);this.props.setQueries(b)},removeFilter:function(a){var b=[].concat(this.state.filters);b.splice(a,1);this.setState({filters:b})},createFilter:function(a){a.preventDefault();a=this.state.filters;var b=this.refs.filterType.getDOMNode();a.push({id:b.value,name:$(b).find("option:selected").text()});this.setState({filters:a})},
createTask:function(a){a.preventDefault()},render:function(){return React.DOM.div({className:"panel content"},React.DOM.form({onSubmit:this.createFilter},React.DOM.div({className:"row"},React.DOM.div({className:"large-12 columns"},React.DOM.label(null,"Filtrar por",React.DOM.select({name:"type",ref:"filterType"},_.map(p,function(a,b){return React.DOM.option({key:b,value:b},a)}))))),React.DOM.div({className:"row"},React.DOM.div({className:"large-12 columns text-right"},React.DOM.button({disabled:!0,
className:"tiny secondary button",onClick:this.createTask},"+ Ordem"),React.DOM.button({type:"submit",className:"tiny success button"},"+ Filtro")))),this.state.filters.length?f({removeFilter:this.removeFilter,filters:this.state.filters,pushQuery:this.pushQuery}):null,React.DOM.div({className:"panel contained"},this.props.queries.map(function(a,b){return k({popQuery:this.popQuery,setQuery:this.setQuery,key:b,query:a})}.bind(this))))}});return React.createClass({displayName:"Tasks",render:function(){return React.DOM.div({id:"Tasks"},
React.DOM.h4(null,"Ordens livres"),e({setQueries:this.props.setQueries,queries:this.props.queries}))}})});