define(function(){function W(b,a){return b<=a?I[a]-I[b]:P[a]-P[b]}function J(b,a,d,c,f,g){var k=e[b],n=e[a],l=e[d],h=e[c],m=e[f],r=e[g],u=e.length-1;return W(0,b)+q[k][n]+W(a,d)+q[l][h]+W(c,f)+q[m][r]+W(g,u)}function ma(){I=Array(e.length);P=Array(e.length);I[0]=0;for(var b=1;b<e.length;++b)I[b]=I[b-1]+q[e[b-1]][e[b]];u=I[e.length-1];P[e.length-1]=0;for(b=e.length-2;0<=b;--b)P[b]=P[b+1]+q[e[b+1]][e[b]]}function K(b,a,d,c,f,g){X=!0;for(var k=Array(e.length),n=0;n<e.length;++n)k[n]=e[n];b+=1;k[b++]=
e[a];if(a<d)for(n=a+1;n<=d;++n)k[b++]=e[n];else for(n=a-1;n>=d;--n)k[b++]=e[n];k[b++]=e[c];if(c<f)for(n=c+1;n<=f;++n)k[b++]=e[n];else for(n=c-1;n>=f;--n)k[b++]=e[n];k[b++]=e[g];e=k;ma()}function na(b,a,d,c){var f=g,x=0,h=g;1==b&&(f=g-1,x=g-1,h=g-1);if(d+q[a][x]<u)if(c==f)for(d+=q[a][x],e[c]=x,u=d,x=0;x<=f;++x)k[x]=e[x];else for(x=1;x<h;++x)C[x]||(C[x]=!0,e[c]=x,na(b,x,d+q[a][x],c+1),C[x]=!1)}function oa(b){for(var a=0,d=0,c=0;c<g;++c)a+=z[c];if(a<b){for(c=0;c<b;++c)z[c]=1;for(c=b;c<g;++c)z[c]=0}else{b=
-1;for(c=0;c<g;++c)if(z[c]){b=c;break}a=-1;for(c=b+1;c<g;++c)if(!z[c]){a=c;break}if(0>a)return-1;z[a]=1;for(c=0;c<a-b-1;++c)z[c]=1;for(c=a-b-1;c<a;++c)z[c]=0}for(c=0;c<g;++c)d+=z[c]<<c;return d}function T(b,a){return null!=a&&""!=a?{location:a,stopover:!0}:{location:b,stopover:!0}}function pa(b){for(var a=-1,d=b+1;d<m.length;++d)r[d]&&(-1==a?a=d:(w.push(T(m[d],s[d])),w.push(T(m[b],s[b]))));-1!=a&&(w.push(T(m[a],s[a])),pa(a),w.push(T(m[b],s[b])))}function qa(b,a){for(var d=-1,c=a,f=b+1;f<m.length;++f)r[f]&&
(c++,-1==d?d=f:(A[a][c]=L[t],G[a][c]=M[t],q[a][c]=N[t++],A[c][a]=L[t],G[c][a]=M[t],q[c][a]=N[t++]));-1!=d&&(A[a][a+1]=L[t],G[a][a+1]=M[t],q[a][a+1]=N[t++],qa(d,a+1),A[a+1][a]=L[t],G[a+1][a]=M[t],q[a+1][a]=N[t++])}function ra(b){ba&&sa(b);w=[];for(var a=ca=g=0;a<m.length;++a)r[a]&&++g;ta=g*(g-1);for(a=0;a<m.length;++a)if(r[a]){w.push(T(m[a],s[a]));pa(a);break}if(g>da)throw"Too many locations! You have "+g+", but max limit is "+da;L=[];M=[];N=[];Y=B=0;"function"==typeof Q&&Q(v);ea(b)}function ea(b){B=
Y;if(B<w.length){for(var a=[],d=0;d<ua&&d+B<w.length;++d)a.push(w[B+d]);var c,f;c=a[0].location;f=a[a.length-1].location;for(var e=[],d=1;d<a.length-1;d++)e[d-1]=a[d];B+=ua;B<w.length-1&&B--;(new google.maps.DirectionsService).route({origin:c,destination:f,waypoints:e,avoidHighways:fa,avoidTolls:ga,unitSystem:ha,travelMode:Z},function(a,c){if(c==google.maps.DirectionsStatus.OK){$=1E3;va=a;for(var d=0;d<a.routes[0].legs.length;++d)++ca,L.push(a.routes[0].legs[d]),N.push(a.routes[0].legs[d].duration.value),
M.push(a.routes[0].legs[d].distance.value);"function"==typeof Q&&Q(v);Y=B;ea(b)}else if(c==google.maps.DirectionsStatus.OVER_QUERY_LIMIT)$*=2,setTimeout(function(){ea(b)},$);else throw"Request failed: "+E[c];})}else Ca(b)}function Ca(b){t=0;A=[];G=[];q=[];for(var a=g=0;a<m.length;++a)r[a]&&(A.push([]),G.push([]),q.push([]),g++);for(a=0;a<g;++a)A[a][a]=null,G[a][a]=0,q[a][a]=0;for(a=0;a<m.length;++a)if(r[a]){qa(a,0);break}sa(b)}function sa(b){C=[];for(var a=0;a<g;++a)C[a]=!1;e=[];k=[];z=[];u=wa;C[0]=
!0;e[0]=0;ba=!0;if(g<=Da+b)na(b,0,0,1);else if(g<=Ea+b){for(var d=1<<g,a=[],c=[],f=0;f<d;++f){a[f]=[];c[f]=[];for(var h=0;h<g;++h)a[f][h]=0,c[f][h]=0}for(f=1;f<g;++f)d=1+(1<<f),a[d][f]=q[0][f];for(h=3;h<=g;++h){for(f=0;f<g;++f)z[f]=0;for(d=oa(h);0<=d;){for(f=1;f<g;++f)if(z[f]){var m=d-(1<<f);a[d][f]=wa;for(var n=1;n<g;++n)z[n]&&n!=f&&a[m][n]+q[n][f]<a[d][f]&&(a[d][f]=a[m][n]+q[n][f],c[d][f]=n)}d=oa(h)}}for(f=0;f<g;++f)k[f]=0;d=(1<<g)-1;if(0==b){b=-1;k[g]=0;for(f=1;f<g;++f)a[d][f]+q[f][0]<u&&(u=a[d][f]+
q[f][0],b=f);k[g-1]=b}else b=g-1,k[g-1]=g-1,u=a[d][g-1];for(f=g-1;0<f;--f)b=c[d][b],d-=1<<k[f],k[f-1]=b}else{for(var a=[],c=[],d=[],l=0;l<g;++l)a[l]=[],c[l]=[];for(l=0;l<g;++l)for(var p=0;p<g;++p)a[l][p]=1,c[l][p]=0;f=0;h=g-1;m=g;1==b&&(f=g-1,h=g-2,m=g-1);for(n=0;20>n;++n){for(var r=0;20>r;++r){for(var s=p=0,l=0;l<g;++l)C[l]=!1;e[0]=p;for(l=0;l<h;++l){C[p]=!0;for(var t=0,y=1;y<m;++y)C[y]||(d[y]=Math.pow(a[p][y],0.1)*Math.pow(q[p][y],-2),t+=d[y]);for(var t=Math.random()*t,v=-1,y=1;y<m;++y)if(!C[y]&&
(v=y,t-=d[y],0>t)){v=y;break}s+=q[p][v];p=e[l+1]=v}e[h+1]=f;s+=q[p][f];y=g;1==b&&(y=g-1);for(var w=!0,l=0;w;)for(w=!1;l<y-2&&!w;++l)for(var t=q[e[l+1]][e[l+2]],v=q[e[l+2]][e[l+1]],B=q[e[l]][e[l+1]],D,A,p=l+2;p<y&&!w;++p){D=t+B+q[e[p]][e[p+1]];A=v+q[e[l]][e[p]]+q[e[l+1]][e[p+1]];if(D>A){s+=A-D;for(D=0;D<Math.floor((p-l)/2);++D)w=e[l+1+D],e[l+1+D]=e[p-D],e[p-D]=w;w=!0;--l}t+=q[e[p]][e[p+1]];v+=q[e[p+1]][e[p]]}s<u&&(k=e,u=s);for(l=0;l<=h;++l)c[e[l]][e[l+1]]+=(u-0.9*u)/(20*(s-0.9*u))}for(l=0;l<g;++l)for(p=
0;p<g;++p)a[l][p]=0.9*a[l][p]+0.1*c[l][p],c[l][p]=0}e=Array(k.length);for(b=0;b<k.length;++b)e[b]=k[b];ma();for(X=!0;X;)for(X=!1,b=0;b<e.length-3;++b)for(a=b+1;a<e.length-2;++a)for(c=a+1;c<e.length-1;++c)J(b,b+1,a,c,a+1,c+1)<u&&K(b,b+1,a,c,a+1,c+1),J(b,a,b+1,a+1,c,c+1)<u&&K(b,a,b+1,a+1,c,c+1),J(b,a,b+1,c,a+1,c+1)<u&&K(b,a,b+1,c,a+1,c+1),J(b,a+1,c,b+1,a,c+1)<u&&K(b,a+1,c,b+1,a,c+1),J(b,a+1,c,a,b+1,c+1)<u&&K(b,a+1,c,a,b+1,c+1),J(b,c,a+1,b+1,a,c+1)<u&&K(b,c,a+1,b+1,a,c+1),J(b,c,a+1,a,b+1,c+1)<u&&K(b,
c,a+1,a,b+1,c+1);for(b=0;b<k.length;++b)k[b]=e[b]}aa()}function aa(){for(var b=[],a=0;a<m.length;++a)r[a]&&b.push(a);for(var d=[],c=[],f=[],e=new google.maps.LatLngBounds,a=1;a<k.length;++a)d.push(A[k[a-1]][k[a]]);for(a=0;a<k.length;++a){var g=m[b[k[a]]];g.toString().substr(1,g.toString().length-2);e.extend(m[b[k[a]]]);f.push(m[b[k[a]]])}c.push({legs:d,bounds:e,copyrights:"Map data \u00a92012 Google",overview_path:f,warnings:[]});ia=va;ia.routes=c;ja&&google.maps.event.removeListener(ja);ja=google.maps.event.addListener(ka,
"error",xa);"function"==typeof O&&O(v)}function ya(b,a){for(var d=-1,c=0;c<m.length;++c)if(!r[c]){d=c;break}if(-1==d)if(m.length<da)m.push(b),F.push(a),r.push(!0),d=m.length-1;else return-1;else m[d]=b,F[d]=a,r[d]=!0;return d}function za(b,a,d){R=!0;Aa.geocode({address:b},function(c,f){if(f==google.maps.GeocoderStatus.OK){if(R=!1,--U,++S,1<=c.length){var e=c[0].geometry.location,g=ya(e,a);b=b.replace("'","");b=b.replace('"',"");s[g]=b;"function"==typeof d&&d(b,e)}}else f==google.maps.GeocoderStatus.OVER_QUERY_LIMIT?
setTimeout(function(){za(b,a,d)},100):(--U,console.log("Failed to geocode address: "+b+". Reason: "+H[f]),++S,R=!1,"function"==typeof d&&d(b))})}function Ba(b,a){var d=s[a],c=m[a],e=r[a],g=F[a];s[a]=s[b];s[b]=d;m[a]=m[b];m[b]=c;r[a]=r[b];r[b]=e;F[a]=F[b];F[b]=g}function h(b,a,d){if(v)throw"You can only create one BpTspSolver at a time.";Aa=new google.maps.Geocoder;ka=new google.maps.DirectionsService;xa=d;v=this}var v,ia,ka,Aa,da=100,Da=0,Ea=15,ua=10,wa=2E9,fa=!1,ga=!1,Z,t,m=[],s=[],H=[],E=[],F=[],
r=[],U=0,R=!1,V=0,S=0,w,L,M,N,A,G,q,C,e,k,u,z,g,I,P,X=!1,B,Y,ca=0,ta=0,ba=!1,$=1E3,va,O=function(){},Q=null,xa=function(b,a){throw"Request failed: "+a;},la=!1,ja=null,ha;h.prototype.startOver=function(){m=[];s=[];F=[];r=[];w=[];L=[];M=[];N=[];A=[];G=[];q=[];C=[];e=[];k=[];u=[];z=[];Z=google.maps.DirectionsTravelMode.DRIVING;U=Y=B=g=0;R=!1;S=V=0;ba=!1;O=function(){};Q=null;la=!1;ha=google.maps.UnitSystem.METRIC;H[google.maps.GeocoderStatus.OK]="Success.";H[google.maps.GeocoderStatus.INVALID_REQUEST]=
"Request was invalid.";H[google.maps.GeocoderStatus.ERROR]="There was a problem contacting the Google servers.";H[google.maps.GeocoderStatus.OVER_QUERY_LIMIT]="The webpage has gone over the requests limit in too short a period of time.";H[google.maps.GeocoderStatus.REQUEST_DENIED]="The webpage is not allowed to use the geocoder.";H[google.maps.GeocoderStatus.UNKNOWN_ERROR]="A geocoding request could not be processed due to a server error. The request may succeed if you try again.";H[google.maps.GeocoderStatus.ZERO_RESULTS]=
"No result was found for this GeocoderRequest.";E[google.maps.DirectionsStatus.INVALID_REQUEST]="The DirectionsRequest provided was invalid.";E[google.maps.DirectionsStatus.MAX_WAYPOINTS_EXCEEDED]="Too many DirectionsWaypoints were provided in the DirectionsRequest. The total allowed waypoints is 8, plus the origin and destination.";E[google.maps.DirectionsStatus.NOT_FOUND]="At least one of the origin, destination, or waypoints could not be geocoded.";E[google.maps.DirectionsStatus.OK]="The response contains a valid DirectionsResult.";
E[google.maps.DirectionsStatus.OVER_QUERY_LIMIT]="The webpage has gone over the requests limit in too short a period of time.";E[google.maps.DirectionsStatus.REQUEST_DENIED]="The webpage is not allowed to use the directions service.";E[google.maps.DirectionsStatus.UNKNOWN_ERROR]="A directions request could not be processed due to a server error. The request may succeed if you try again.";E[google.maps.DirectionsStatus.ZERO_RESULTS]="No route could be found between the origin and destination."};h.prototype.addAddressWithLabel=
function(b,a,d){++U;++V;v.addAddressAgain(b,a,d,V-1)};h.prototype.addAddress=function(b,a){v.addAddressWithLabel(b,null,a)};h.prototype.addAddressAgain=function(b,a,d,c){R||c>S?setTimeout(function(){v.addAddressAgain(b,a,d,c)},100):za(b,a,d)};h.prototype.addWaypointWithLabel=function(b,a,d){++V;v.addWaypointAgain(b,a,d,V-1)};h.prototype.addWaypoint=function(b,a){v.addWaypointWithLabel(b,null,a)};h.prototype.addWaypointAgain=function(b,a,d,c){R||c>S?setTimeout(function(){v.addWaypointAgain(b,a,d,c)},
100):(ya(b,a),++S,"function"==typeof d&&d(b))};h.prototype.getWaypoints=function(){for(var b=[],a=0;a<m.length;a++)r[a]&&b.push(m[a]);return b};h.prototype.getAddresses=function(){for(var b=[],a=0;a<s.length;a++)r[a]&&b.push(s[a]);return b};h.prototype.getLabels=function(){for(var b=[],a=0;a<F.length;a++)r[a]&&b.push(F[a]);return b};h.prototype.removeWaypoint=function(b){for(var a=0;a<m.length;++a)if(r[a]&&m[a].equals(b))return r[a]=!1,!0;return!1};h.prototype.removeAddress=function(b){for(var a=
0;a<s.length;++a)if(r[a]&&s[a]==b)return r[a]=!1,!0;return!1};h.prototype.setAsStop=function(b){for(var a=-1,d=m.length-1;0<=d;--d)if(-1==a&&r[d]&&(a=d),r[d]&&m[d].equals(b)){for(b=d;b<a;++b)Ba(b,b+1);break}};h.prototype.setAsStart=function(b){for(var a=-1,d=0;d<m.length;++d)if(-1==a&&r[d]&&(a=d),r[d]&&m[d].equals(b)){for(b=d;b>a;--b)Ba(b,b-1);break}};h.prototype.getGDirections=function(){return ia};h.prototype.getGDirectionsService=function(){return ka};h.prototype.getOrder=function(){return k};
h.prototype.getAvoidHighways=function(){return fa};h.prototype.setAvoidHighways=function(b){fa=b};h.prototype.getAvoidTolls=function(){return ga};h.prototype.setAvoidTolls=function(b){ga=b};h.prototype.getTravelMode=function(){return Z};h.prototype.setTravelMode=function(b){Z=b};h.prototype.getDurations=function(){return q};h.prototype.getTotalDuration=function(){return gebDirections.getDuration().seconds};h.prototype.isReady=function(){return 0==U};h.prototype.solveRoundTrip=function(b){if(la)throw"Cannot continue after fatal errors.";
this.isReady()?("function"==typeof b&&(O=b),ra(0)):setTimeout(function(){v.solveRoundTrip(b)},20)};h.prototype.solveAtoZ=function(b){if(la)throw"Cannot continue after fatal errors.";this.isReady()?("function"==typeof b&&(O=b),ra(1)):setTimeout(function(){v.solveAtoZ(b)},20)};h.prototype.setDirectionUnits=function(b){ha="m"==b?google.maps.UnitSystem.IMPERIAL:google.maps.UnitSystem.METRIC};h.prototype.setOnProgressCallback=function(b){Q=b};h.prototype.getNumDirectionsComputed=function(){return ca};
h.prototype.getNumDirectionsNeeded=function(){return ta};h.prototype.reverseSolution=function(){for(var b=0;b<k.length/2;++b){var a=k[k.length-1-b];k[k.length-1-b]=k[b];k[b]=a}aa()};h.prototype.reorderSolution=function(b,a){"function"==typeof a&&(O=a);for(var d=Array(k.length),c=0;c<k.length;++c)d[c]=k[b[c]];k=d;aa()};h.prototype.removeStop=function(b,a){"function"==typeof a&&(O=a);for(var d=Array(k.length-1),c=0;c<k.length;++c)c!=b&&(d[c-(c>b?1:0)]=k[c]);k=d;aa()};return h});
