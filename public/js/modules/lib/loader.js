;(function(){
    var deps = [
        '//cdnjs.cloudflare.com/ajax/libs/lodash.js/2.4.1/lodash.min.js',
        '//cdnjs.cloudflare.com/ajax/libs/pace/0.4.17/pace.min.js',
        '//ajax.googleapis.com/ajax/libs/jquery/2.1.1/jquery.min.js',
        '/js/foundation/foundation.min.js',
        pager.isDev ? '/js/inject.js' : '/js/inject.min.js'
    ];
    if (!window.btoa) { deps.unshift('//cdnjs.cloudflare.com/ajax/libs/Base64/0.3.0/base64.min.js'); }

    LazyLoad.js(deps, function () {
        window.Base64 = {
            encode: window.btoa,
            decode: window.atob
        };
        pager = _.merge(pager, JSON.parse(Base64.decode(#{appData})));
        Inject.setModuleRoot(pager.isDev ? '/js/modules' : '/js/build');
        Inject.setExpires(pager.isDev && 2 === 1 ? 0 : 1000 * 60 * 24);
        require.run('lib/main.js');
    });
}());