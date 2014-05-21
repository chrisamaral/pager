"use strict";
var mysql = require('mysql'),
    app = require('./base.js')(mysql);


require('./controllers/main.js');