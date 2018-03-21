const util = require('../util/util.js');

/* feedback */

module.exports.feedbackGet = (req, res, next) => {
    util.checkUserLoginWithRedirect(req, res, next);

    return res.render('api/feedback');
};

const nodemailer = require('nodemailer');
module.exports.feedbackPost = (req, res, next) => {
    // TODO: add normal email account
    nodemailer.createTestAccount((err, account) => {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: account.user, // generated ethereal user
                pass: account.pass, // generated ethereal password
            },
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: req.body.email, // sender address
            to: 'gotoss08@gmail.com', // list of receivers
            subject: 'SvoimHodom Feedback', // Subject line
            text: req.body.body, // plain text body
            html: req.body.body, // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (err, info) => {
            if (err) return next(err);

            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));

            return res.status(200).send();

            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
};

/* country */
const Country = require('../models/country.model.js');

module.exports.createCountry = (req, res, next) => {
    if (!req.body.countries || !req.body.countries.length || req.body.countries.length < 1) return res.sendStatus(400);

    Country.create(req.body.countries, (err, countries) => {
        if (err) return next(err);

        return res.status(200).send(countries);
    });
};

module.exports.findCountry = (req, res, next) => {


};

/* post image upload */
const path = require('path');
const mkdirp = require('mkdirp');
const uniqid = require('uniqid');

module.exports.imageUpload = (req, res, next) => {
    console.log('upload started');

    if (!req.files) {
        return res.status(400).send('No files uploaded!');
    }

    if (!req.body.dir || !req.body.filename) {
        return res.status(400).send('Invalid dir or filename!');
    }

    let file = req.files.file;
    let dir = req.body.dir;
    let filename = req.body.filename;

    console.log('file', file, 'dir', dir, 'filename', filename);

    let filepath = path.join(__dirname, '..', '..', 'public', dir, filename);
    let dirname = path.dirname(filepath);

    mkdirp(dirname, function(err) {
        if (err) return next(err);

        console.log('Storing user file at: ' + filepath);

        file.mv(filepath, (err) => {
            if (err) return next(err);
            return res.sendStatus(204);
        });
    });
};

module.exports.imageGenerateKey = (req, res, next) => {
    if (req.body.filename) {
        let date = new Date();
        let day = date.toISOString().slice(0, 10);
        let time = date.getTime();
        let filename = uniqid() + '-' + time + '-' + req.body.filename;

        return res.status(200).send({dir: 'post_files/' + day + '/', filename: filename});
    } else {
        return res.status(400).send('invalid filename');
    }
};

/* test page for creating and testing elements */

module.exports.test = (req, res, next) => {
    return res.render('api/test');
};
