"use strict";
require('debug');
var app;

function setVariables() {
    var fs = require('fs');
    this.dbConfig = require('./config/mysql.json');
    this.ENV = fs.existsSync('./config/development') ? 'development' : 'production';
    this.httpProtocol = 'http';
    this.appID = 'xhuzy3eeg';
    this.DOMAIN = this.ENV === 'production' ? 'acwautosis.info' : 'acw.dev';
    this.SUBDOMAIN = this.ENV === 'production' ? 'pager.acwautosis.info' : 'pager.acw.dev';
    this.baseUrl = this.httpProtocol + '://' + this.DOMAIN;
    this.appUrl = this.httpProtocol + '://' + this.SUBDOMAIN;

    this.dbConfig.multipleStatements = (this.ENV === 'development');

    console.log("ENVIROMENT: " + this.ENV);
    console.log("DOMAIN: " + this.DOMAIN);
    console.log("SUB-DOMAIN: " + this.SUBDOMAIN);
}

function Base(mysql) {
    setVariables.call(this);
    this.waitTime = 2;
    this.mysql = mysql;
}

Base.prototype.handleDbError = function (err) {
    setTimeout(this.startConnection.bind(this), this.waitTime * 1000);
    console.log('error when connecting to db:', err.code, 'will try again in', this.waitTime, 'seconds');
};

Base.prototype.startConnection = function () {
    console.log('connecting to db...');
    this.mysql = this.mysql.createConnection(this.dbConfig);

    this.mysql.connect(function (err) {
        if (!err) {
            console.log('... connected!');
        } else {
            this.handleDbError(err);
        }
    }.bind(this));

    this.mysql.on('error', function (err) {
        console.log('generic db error handler', err);
        if (!err.fatal) {
            return;
        }

        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            this.handleDbError(err);
        } else {
            throw err;
        }

    }.bind(this));
};

module.exports = function (mysql) {
    if (mysql) {
        app = new Base(mysql);
        //app.helpers = require('./helpers/std.js');
        app.strftime = require('strftime');
        app.startConnection();
        app.panic = function (msg) {
            console.error(msg);
            proccess.exit();
        };
    }
    return app;
};

