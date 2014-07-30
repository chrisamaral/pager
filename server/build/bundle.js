(function () {
    function supports_html5_storage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }
    function setCacher(){
        var jsLoad = LazyLoad.js;

        function ajaxCacheLoad(type, urls, callback) {
            var callbacks = [];

            if (urls instanceof Array === false) {
                urls = [urls];
            }

            var completed = 0, sameDomain = urls.every(function (url) {
                return url.substr(0, 1) === '/' && url.substr(0, 2) !== '//';
            });

            if (!sameDomain) {
                return jsLoad.call(LazyLoad, urls, callback);
            }

            urls.forEach(function () {
                callbacks.push(null);
            });

            function createAssetTag(text, tag, url) {
                if (tag === 'script') {
                    var g = document.createElement(tag),
                        s = document.getElementsByTagName('script')[0],
                        aux;
                    if (typeof pager !== 'undefined' && pager.build && pager.build.js) {
                        aux = pager.build.js;

                        for (var i in aux) {
                            if (aux.hasOwnProperty(i) && aux[i] === url) {
                                g.id = 'script_' + i;
                                break;
                            }
                        }
                    }

                    g.text = text;
                    s.parentNode.insertBefore(g, s);
                } else {
                    var head = document.head || document.getElementsByTagName('head')[0],
                        style = document.createElement('style');

                    style.type = 'text/css';
                    if (style.styleSheet) {
                        style.styleSheet.cssText = text;
                    } else {
                        style.appendChild(document.createTextNode(text));
                    }

                    head.appendChild(style);
                }
            }

            function createScriptTag(text, url) {
                createAssetTag(text, 'script', url);
            }

            function createStyleTag(text, url) {
                createAssetTag(text, 'style', url);
            }

            function parseJsText(url, text) {

                /* localStorage disabled
                    localStorage.setItem('ObeseLoadExpiration:' + url, Date.now() + 1000 * 60 * 60 * 24);
                    localStorage.setItem('ObeseLoad:' + url, text);
                */

                if (type === 'js') {
                    createScriptTag(text, url);
                    //eval(text);
                } else {
                    createStyleTag(text, url);
                }

            }

            function proceed() {
                completed++;
                if (completed === urls.length) {
                    callbacks.forEach(function (callback) {
                        return callback && callback();
                    });
                    return callback && callback();
                }
            }

            function loadFromLocalStorage(url) {
                return null;
                /* disabled
                var expiration = localStorage.getItem('ObeseLoadExpiration:' + url);
                if (expiration && parseInt(expiration, 10) > Date.now()) {
                    return localStorage.getItem('ObeseLoad:' + url);
                } else {
                    localStorage.removeItem('ObeseLoadExpiration:' + url);
                    localStorage.removeItem('ObeseLoad:' + url);
                }
                return null;
                */
            }

            urls.forEach(function (url, index) {
                var xhr, fromLocalStorage = loadFromLocalStorage(url);

                if (fromLocalStorage) {

                    callbacks[index] = function () {
                        if (type === 'js') {
                            createScriptTag(fromLocalStorage, url);
                            //eval(fromLocalStorage);
                        } else {
                            createStyleTag(fromLocalStorage, url);
                        }
                    };

                    return proceed();
                }

                xhr = new XMLHttpRequest();
                xhr.onload = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            callbacks[index] = function () {
                                parseJsText(url, xhr.responseText);
                            };
                            proceed();
                        } else {
                            console.error(xhr.statusText);
                        }
                    }
                };
                xhr.open('get', url, true);
                xhr.send();
            });
        }

        LazyLoad.js = function (urls, callback) {
            ajaxCacheLoad('js', urls, callback);
        };
        /*
         LazyLoad.css = function (urls, callback) {
         ajaxCacheLoad('css', urls, callback);
         };
         */
    }

    if (supports_html5_storage()) {
        setCacher();
    }

}());
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

    var build = JSON.parse('{"moduleRoot":"/js/modules","moduleExpiration":0,"pager":{"isDev":true},"js":{"lazyload":"/js/modules/ext/lazyload.js","inject":"/js/inject.js","base64":"/js/modules/ext/base64.js","lodash":"/js/modules/ext/lodash.js","modernizr":"/js/modules/ext/modernizr.js","pace":"/js/modules/ext/pace.js","jquery":"/js/modules/ext/jquery.js","react":"/js/modules/ext/react-with-addons-0.10.0.js","foundation":"/js/modules/ext/foundation.min.js"},"css":{"pace":"/css/pace.css","normalize":"/css/normalize.css","foundation":"/css/foundation.min.css","foundationIcons":"/css/foundation-icons/foundation-icons.css","main":"/css/main.css","admin":"/css/admin.css","console":"/css/console.css"}}'),
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