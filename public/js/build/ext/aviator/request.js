define(["./helpers"],function(b){var c=b.each,f=b.merge,g=b.isArray;b=function(a){this.namedParams={};this.queryParams={};this.params={};this.uri=a.uri;this.queryString=a.queryString;this.matchedRoute=a.matchedRoute;this._extractNamedParamsFromURI();this._extractQueryParamsFromQueryString();this._mergeParams()};b.prototype={_extractNamedParamsFromURI:function(){var a=this.uri.split("/"),d=this.matchedRoute.split("/"),b={};c(d,function(d,c){var e;0===d.indexOf(":")&&(e=d.replace(":",""),b[e]=decodeURIComponent(a[c]))});
this.namedParams=b},_extractQueryParamsFromQueryString:function(){var a;this.queryString&&(a=this.queryString.replace("?","").split("&"),c(a,function(a){var b=decodeURIComponent(a.split("=")[0]),c=decodeURIComponent(a.split("=")[1]);-1!==a.indexOf("=")&&this._applyQueryParam(b,c)},this))},_applyQueryParam:function(a,b){-1!==a.indexOf("[]")?(a=a.replace("[]",""),g(this.queryParams[a])?this.queryParams[a].push(b):this.queryParams[a]=[b]):this.queryParams[a]=b},_mergeParams:function(){this.params=f(this.namedParams,
this.queryParams)}};return b});