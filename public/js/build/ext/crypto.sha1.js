define(function(){var s=s||function(e,n){var q={},k=q.lib={},m=function(){},f=k.Base={extend:function(a){m.prototype=this;var c=new m;a&&c.mixIn(a);c.hasOwnProperty("init")||(c.init=function(){c.$super.init.apply(this,arguments)});c.init.prototype=c;c.$super=this;return c},create:function(){var a=this.extend();a.init.apply(a,arguments);return a},init:function(){},mixIn:function(a){for(var c in a)a.hasOwnProperty(c)&&(this[c]=a[c]);a.hasOwnProperty("toString")&&(this.toString=a.toString)},clone:function(){return this.init.prototype.extend(this)}},
p=k.WordArray=f.extend({init:function(a,c){a=this.words=a||[];this.sigBytes=c!=n?c:4*a.length},toString:function(a){return(a||h).stringify(this)},concat:function(a){var c=this.words,r=a.words,d=this.sigBytes;a=a.sigBytes;this.clamp();if(d%4)for(var b=0;b<a;b++)c[d+b>>>2]|=(r[b>>>2]>>>24-b%4*8&255)<<24-(d+b)%4*8;else if(65535<r.length)for(b=0;b<a;b+=4)c[d+b>>>2]=r[b>>>2];else c.push.apply(c,r);this.sigBytes+=a;return this},clamp:function(){var a=this.words,c=this.sigBytes;a[c>>>2]&=4294967295<<32-
c%4*8;a.length=e.ceil(c/4)},clone:function(){var a=f.clone.call(this);a.words=this.words.slice(0);return a},random:function(a){for(var c=[],b=0;b<a;b+=4)c.push(4294967296*e.random()|0);return new p.init(c,a)}}),b=q.enc={},h=b.Hex={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++){var f=c[d>>>2]>>>24-d%4*8&255;b.push((f>>>4).toString(16));b.push((f&15).toString(16))}return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d+=2)b[d>>>3]|=parseInt(a.substr(d,2),16)<<
24-d%8*4;return new p.init(b,c/2)}},g=b.Latin1={stringify:function(a){var c=a.words;a=a.sigBytes;for(var b=[],d=0;d<a;d++)b.push(String.fromCharCode(c[d>>>2]>>>24-d%4*8&255));return b.join("")},parse:function(a){for(var c=a.length,b=[],d=0;d<c;d++)b[d>>>2]|=(a.charCodeAt(d)&255)<<24-d%4*8;return new p.init(b,c)}},t=b.Utf8={stringify:function(a){try{return decodeURIComponent(escape(g.stringify(a)))}catch(c){throw Error("Malformed UTF-8 data");}},parse:function(a){return g.parse(unescape(encodeURIComponent(a)))}},
l=k.BufferedBlockAlgorithm=f.extend({reset:function(){this._data=new p.init;this._nDataBytes=0},_append:function(a){"string"==typeof a&&(a=t.parse(a));this._data.concat(a);this._nDataBytes+=a.sigBytes},_process:function(a){var c=this._data,b=c.words,d=c.sigBytes,f=this.blockSize,h=d/(4*f),h=a?e.ceil(h):e.max((h|0)-this._minBufferSize,0);a=h*f;d=e.min(4*a,d);if(a){for(var g=0;g<a;g+=f)this._doProcessBlock(b,g);g=b.splice(0,a);c.sigBytes-=d}return new p.init(g,d)},clone:function(){var a=f.clone.call(this);
a._data=this._data.clone();return a},_minBufferSize:0});k.Hasher=l.extend({cfg:f.extend(),init:function(a){this.cfg=this.cfg.extend(a);this.reset()},reset:function(){l.reset.call(this);this._doReset()},update:function(a){this._append(a);this._process();return this},finalize:function(a){a&&this._append(a);return this._doFinalize()},blockSize:16,_createHelper:function(a){return function(c,b){return(new a.init(b)).finalize(c)}},_createHmacHelper:function(a){return function(b,f){return(new u.HMAC.init(a,
f)).finalize(b)}}});var u=q.algo={};return q}(Math);(function(){var e=s,n=e.lib,q=n.WordArray,k=n.Hasher,m=[],n=e.algo.SHA1=k.extend({_doReset:function(){this._hash=new q.init([1732584193,4023233417,2562383102,271733878,3285377520])},_doProcessBlock:function(f,p){for(var b=this._hash.words,h=b[0],g=b[1],e=b[2],l=b[3],k=b[4],a=0;80>a;a++){if(16>a)m[a]=f[p+a]|0;else{var c=m[a-3]^m[a-8]^m[a-14]^m[a-16];m[a]=c<<1|c>>>31}c=(h<<5|h>>>27)+k+m[a];c=20>a?c+((g&e|~g&l)+1518500249):40>a?c+((g^e^l)+1859775393):
60>a?c+((g&e|g&l|e&l)-1894007588):c+((g^e^l)-899497514);k=l;l=e;e=g<<30|g>>>2;g=h;h=c}b[0]=b[0]+h|0;b[1]=b[1]+g|0;b[2]=b[2]+e|0;b[3]=b[3]+l|0;b[4]=b[4]+k|0},_doFinalize:function(){var f=this._data,e=f.words,b=8*this._nDataBytes,h=8*f.sigBytes;e[h>>>5]|=128<<24-h%32;e[(h+64>>>9<<4)+14]=Math.floor(b/4294967296);e[(h+64>>>9<<4)+15]=b;f.sigBytes=4*e.length;this._process();return this._hash},clone:function(){var e=k.clone.call(this);e._hash=this._hash.clone();return e}});e.SHA1=k._createHelper(n);e.HmacSHA1=
k._createHmacHelper(n)})();return s});
