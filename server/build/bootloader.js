(function () {
    var xxTimeout;
    if (window.applicationCache) {
        applicationCache.addEventListener('updateready', function() {
            clearTimeout(xxTimeout);
            xxTimeout = setTimeout(function () {
                if (confirm('O PAGER acabou de receber uma atualização, deseja recarregar agora?')) {
                    window.location.reload();
                }
            }, 1000);
        });
    }

    var build = JSON.parse('[ INSERT BUILD OBJECT HERE ]'),
        jsDeps = [
            build.js.lodash,
            build.js.modernizr,
            build.js.jquery,
            build.js.pace,
            build.js.react,
            build.js.foundation,
            build.js.inject
        ], cssDeps = [
            build.css.normalize,
            build.css.foundation,
            build.css.pace,
            build.css.foundationIcons,
            build.css.main
        ];

    if (!window.btoa) {
        jsDeps.unshift(build.js.base64);
    }

    window.pager = build.pager;
    delete build.pager;
    window.pager.build = build;

    LazyLoad.css(cssDeps);
    LazyLoad.js(jsDeps, function () {

        window.Base64 = {
            encode: window.btoa.bind(window),
            decode: window.atob.bind(window)
        };

        Inject.setModuleRoot(build.moduleRoot);
        Inject.setExpires(build.moduleExpiration);

        require.run('lib/main.js');
    });

}());