const util = require('../util/util.js');

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
