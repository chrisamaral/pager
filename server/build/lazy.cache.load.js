;(function () {
    function supports_html5_storage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }
    function setCacher(){
        var jsLoad = LazyLoad.js, allStuff = '', callbacks = [];

        function ajaxCacheLoad(type, urls, callback) {
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

            function createAssetTag(text, tag) {
                if (tag === 'script') {
                    var g = document.createElement(tag);
                    var s = document.getElementsByTagName('script')[0];
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

            function createScriptTag(text) {
                createAssetTag(text, 'script');
            }

            function createStyleTag(text) {
                createAssetTag(text, 'style');
            }

            function parseJsText(url, text) {
                localStorage.setItem('Iscache-ObeseLoadExpiration:' + url, Date.now() + 1000 * 60 * 60 * 24);
                localStorage.setItem('Iscache-ObeseLoad:' + url, text);
                if (type === 'js') {
                    //createScriptTag(text);
                    eval(text);
                } else {
                    createStyleTag(text);
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
                var expiration = localStorage.getItem('Iscache-ObeseLoadExpiration:' + url);
                if (expiration && parseInt(expiration, 10) > Date.now()) {
                    return localStorage.getItem('Iscache-ObeseLoad:' + url);
                } else {
                    localStorage.removeItem('Iscache-ObeseLoadExpiration:' + url);
                    localStorage.removeItem('Iscache-ObeseLoad:' + url);
                }
                return null;
            }

            urls.forEach(function (url, index) {
                var xhr, fromLocalStorage = loadFromLocalStorage(url);

                if (fromLocalStorage) {

                    callbacks[index] = function () {
                        if (type === 'js') {
                            //createScriptTag(fromLocalStorage);
                            eval(fromLocalStorage);
                        } else {
                            createStyleTag(fromLocalStorage);
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