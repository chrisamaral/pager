define(['../ext/strftime'], function (strftime) {

    var cssLoad = LazyLoad.css;

    function isNewStylesheet(url) {

        url = url.substr(0, 2) === '//' || url.substr(0, 4) === 'http' ? url : pager.urls.app + url;

        for (var i = 0; i < document.styleSheets.length; i++) {
            if (document.styleSheets[i].href === url) {
                return false;
            }
        }

        return true;
    }

    LazyLoad.css = function(urls, callback){

        if (!urls) {
            return;
        }

        urls = _.isArray(urls) ? urls : [urls];
        urls = urls.filter(isNewStylesheet);

        cssLoad.call(LazyLoad, urls, callback);
    };
    Date.prototype.toYMD = function () {
        return strftime('%Y-%m-%d', this);
    };

    Date.prototype.toYMDHMS = function () {
        return strftime('%Y-%m-%d %H:%M:%S', this);
    };

    return null;
});