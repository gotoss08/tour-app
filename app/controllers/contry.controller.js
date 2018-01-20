const Country = require('../models/country.model');

module.exports.allGet = (req, res) => {
    let countries = [];

    Country.find({}, (err, fndCountries) => {
        countries = fndCountries;
        return res.render('country/all', { countries: fndCountries });
    });
};