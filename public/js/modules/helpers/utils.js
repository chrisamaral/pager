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
    function padZero (str) {
        str = _.isString(str) ? str : '' + str;
        return str.length >= 2 ? str : '0' + str;
    }
    Date.prototype.toYMD = function () {
        return this.getFullYear() + '-' + padZero(this.getMonth() + 1) + '-' + padZero(this.getDate());
    };

    Date.prototype.fromYMD = function (str) {
        var d = new Date(str);
        if (d.toYMD().replace(/\D/g,'') !== str.replace(/\D/g,'')) {
            d.setHours(0,0,0,0);
            d.setTime(d.getTime() + 1000 * 60 * 60 * 24);
        }
        return d;
    };

    Date.prototype.toYMDHMS = function () {
        return strftime('%Y-%m-%d %H:%M:%S', this);
    };

    return {
        doGetCaretPosition: function (ctrl) {

            var CaretPos = 0;
            // IE Support
            if (document.selection) {

                ctrl.focus();
                var Sel = document.selection.createRange();

                Sel.moveStart('character', -ctrl.value.length);

                CaretPos = Sel.text.length;
            }
            // Firefox support
            else if (ctrl.selectionStart || ctrl.selectionStart == '0')
                CaretPos = ctrl.selectionStart;

            return (CaretPos);

        },

        setCaretPosition: function (el, caretPos) {

            el.value = el.value;
            // ^ this is used to not only get "focus", but
            // to make sure we don't have it everything -selected-
            // (it causes an issue in chrome, and having it doesn't hurt any other browser)

            if (el !== null) {

                if (el.createTextRange) {
                    var range = el.createTextRange();
                    range.move('character', caretPos);
                    range.select();
                    return true;
                } else {
                    // (el.selectionStart === 0 added for Firefox bug)
                    if (el.selectionStart || el.selectionStart === 0) {
                        el.focus();
                        el.setSelectionRange(caretPos, caretPos);
                        return true;
                    }

                    else  { // fail city, fortunately this never happens (as far as I've tested) :)
                        el.focus();
                        return false;
                    }
                }
            }
        }, loadAPIKeys: function (callback) {

            if (pager.keys) return callback(pager.keys);

            $.get('/' + pager.org.id + '/api/k')
                .done(function (keys) {
                    if(keys && _.isObject(keys)) {
                        pager.keys = keys;
                        callback(keys);
                    }
                });
        }
    };
});