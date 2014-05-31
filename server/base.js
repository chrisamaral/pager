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
    console.log('mysql: error when on connection:', err.code, 'will try again in', this.waitTime, 'seconds');
};

Base.prototype.startConnection = function () {
    console.log('mysql: connecting...');
    this.mysql = this.mysql.createConnection(this.dbConfig);

    this.mysql.connect(function (err) {
        if (!err) {
            console.log('mysql: connected!');
        } else {
            this.handleDbError(err);
        }
    }.bind(this));

    this.mysql.on('error', function (err) {
        console.log('mysql: generic db error handler', err);
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

Base.prototype.panic = function (msg) {
    console.error(msg);
    process.exit();
};

Base.prototype.mongoSetup = function () {
    console.log('mongodb: reading config...');

    var MongoClient = require('mongodb').MongoClient,
        cfg = require('./config/mongo.json'),
        url = 'mongodb://' + /*cfg.user + ':' + cfg.password + '@' + */ cfg.host + ':' + cfg.port + '/' + cfg.database;

    console.log('mongodb: connecting...');
    MongoClient.connect(url,
        function (err, db) {

            if (err) {
                this.panic(err);
            }
            console.log('mongodb: connected!');
            this.mongo = db;
        }.bind(this));
    this.mongoClient = MongoClient;
};

module.exports = function (mysql) {
    if (mysql) {
        app = new Base(mysql);
        //app.helpers = require('./helpers/std.js');
        app.strftime = require('strftime');
        app.startConnection();
        app.mongoSetup();
    }
    return app;
};

