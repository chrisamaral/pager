define(['../ext/strftime'], function (strftime) {

    Date.prototype.toYMD = function () {
        return strftime('%Y-%m-%d', this);
    };

    Date.prototype.toYMDHMS = function () {
        return strftime('%Y-%m-%d %H:%M:%S', this);
    };

    return null;
});