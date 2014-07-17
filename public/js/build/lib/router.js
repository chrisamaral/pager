define(["../ext/strftime"],function(q){function k(a,f,b){var c=!1;this.id=Math.random().toString(36).substr(2);this.deferred=$.Deferred();$.when($.get(pager.build.moduleRoot+"/lib/router.worker.js"),$.get(pager.build.moduleRoot+"/ext/crypto.sha1.js")).done(function(d,c){d=d[0];c=c[0];var l=new Blob([$("#script_lodash").text(),c,d],{type:"application/javascript"}),l=window.URL.createObjectURL(l);this.webWorker=new Worker(l);window.URL.revokeObjectURL(l);this.connectToWorker();this.webWorker.postMessage({cmd:"startRouter",
data:{tasks:f,workers:b,day:a}})}.bind(this));var d=this.deferred.promise();this.stopRouter=function(){console.groupEnd();console.log("Stopping Router...");c=!0};d.stopRouter=this.stopRouter;this.amIDead=function(){return c};return d}var m,b;k.prototype.fetchTypes=function(a){$.get(pager.urls.ajax+"console/typeDuration",{types:a}).done(function(a){this.webWorker.postMessage({cmd:"parseTypes",data:a})}.bind(this))};k.prototype.workerRouteOptimizer=function(a,f){function g(){if(!c.amIDead()){var d,
p,g,l,k,h,n=0,e;if(a.tasks.length){d=b.getGDirections();p=b.getOrder();g=a.tasks.concat();l=!!a.startPoint;k=!(!a.endPoint&&null===a.endPoint);a.tasks=[];for(var m=l?1:0;m<(k?p.length-1:p.length);m++)e=g[p[m]-(l?1:0)],(h=d.routes[0])&&(h=h.legs[a.tasks.length]),h&&(e.directions={origin:{lat:h.start_location.lat(),lng:h.start_location.lng()},distance:h.distance,duration:h.duration,schedule:{ini:new Date,end:new Date}},e.directions.schedule.ini.setTime(a.workShift.from.getTime()+n),n+=1E3*h.duration.value,
e.directions.schedule.end.setTime(a.workShift.from.getTime()+n),e.schedule=e.schedule||{},e.schedule.ini=new Date,e.schedule.end=new Date,e.schedule.ini.setTime(a.workShift.from.getTime()+n),n+=e.duration,e.schedule.end.setTime(a.workShift.from.getTime()+n),a.tasks.push(e));g=null;a.drawDirections=function(){if(a.directions)return a.directions.setMap(null),delete a.directions,!1;a.directions=new google.maps.DirectionsRenderer({directions:d,map:pager.console.map,polylineOptions:{strokeColor:a.color},
suppressMarkers:!0});return!0};a.cleanDirections=function(){a.directions&&(a.directions.setMap(null),delete a.directions)}}console.groupEnd();c.deferred.notify("message","Calculada rota de "+a.name);f()}}var c=this;this.amIDead()||(console.group(a.name),a.tasks.length?(b.startOver(),b.setTravelMode(google.maps.DirectionsTravelMode.DRIVING),b.addWaypoint(new google.maps.LatLng(a.startPoint.lat,a.startPoint.lng),function(){console.log("startPoint",a.startPoint)}),_.forEach(a.tasks,function(a){b.addWaypoint(new google.maps.LatLng(a.location.lat,
a.location.lng),function(){console.log("new waypoint",a.address.address)})}),a.endPoint&&b.addWaypoint(new google.maps.LatLng(a.endPoint.lat,a.endPoint.lng),function(){console.log("endPoint",a.endPoint)}),a.endPoint||null===a.endPoint?b.solveAtoZ(g):b.solveRoundTrip(g)):g())};k.prototype.startTSP=function(a){if(!this.amIDead()){this.deferred.notify("Iniciando Otimizador de Dire\u00e7\u00f5es...");var f=this,g=["../ext/async"];m||g.push("../ext/BpTspSolver");require.ensure(g,function(c){var d=c("../ext/async");
m=m||c("../ext/BpTspSolver");b=b||new m(pager.console.map,null,function(){alert("Ops... Ocorreu um erro e o Roteamento foi abortado.");console.log(arguments);f.stopRouter();f.deferred.reject()});d.eachSeries(a,f.workerRouteOptimizer.bind(f),function(b){if(b)throw b;f.deferred.notify("message","Finalizado c\u00e1lculo de rotas");f.deferred.resolve(a)})})}};k.prototype.connectToWorker=function(){this.webWorker.addEventListener("message",function(a){if(!this.amIDead())switch(a.data.type){case "progressLog":console.log(a.data.data);
break;case "logMessage":this.deferred.notify("message",a.data.data);break;case "assertion":pager.isDev&&console.assert(a.data.data[0],a.data.data[1]||"Assertion failed");break;case "fetchTypes":this.fetchTypes(a.data.data);break;case "endOfTheLine":this.startTSP(a.data.data)}}.bind(this))};return k});
