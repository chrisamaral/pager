var lastLookup=Date.now();
define(function(){function l(c){if(!c||!c.components)return null;var a=null;c.components.forEach(function(b){a=a||{};b&&b.name&&b.value&&(a[b.name]=b.value)});return a}function g(c){this.status="OK";var a=c.concat();this.init=function(){this.processGeoQueue(a)}}g.prototype.abort=function(){console.log("will abort lookup");this.status="Aborted"};g.prototype.processGeoQueue=function(c){function a(h){if("aborted"!==b.status.toLowerCase()){var d=h.splice(0,1),g,k=function(){1100<Date.now()-lastLookup?
a(h):setTimeout(k,100)};if(!d.length)return b.onComplete();d=d[0];if(d.location){if(_.isFunction(b.onProgress))b.onProgress(c.length-h.length,c.length,d,"unchanged");return k()}g=new google.maps.Geocoder;var f={address:d.address.address},e=l(d.address);e&&(f.componentRestrictions={},e.city&&(f.componentRestrictions.locality=e.city),e.country&&(f.region=e.country,f.componentRestrictions.country=e.country),e.state&&(f.componentRestrictions.administrativeArea=e.state));console.log("searching",f.address);
lastLookup=Date.now();g.geocode(f,function(a,e){var f,g;if(e===google.maps.GeocoderStatus.OK){f=a[0].geometry.location.lat();g=a[0].geometry.location.lng();d.location={lat:f,lng:g};if(_.isFunction(b.onProgress))b.onProgress(c.length-h.length,c.length,d);$.post(pager.urls.ajax+"workOrder/"+d._id+"/location",d.location)}else console.log("Geocode failure: "+e);k()})}}var b=this;a(c.concat())};return g});
