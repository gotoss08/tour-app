'use strict';

var mongoose = require('mongoose');

var CountrySchema = new mongoose.Schema({
    name: String,
    img: String
});

module.exports = mongoose.model('Country', CountrySchema);