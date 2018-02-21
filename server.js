const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const dbConfig = require('./config/database.config');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const fileUpload = require('express-fileupload');
const __y18n = require('y18n')({ locale: 'ru_RU' }).__;
const dateformat = require('dateformat');
dateformat.masks.date = 'd.mm.yyyy';
dateformat.masks.time = 'h:MM:ss';
dateformat.i18n = {
    dayNames: [
        'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat',
        __y18n('Sunday'), __y18n('Monday'), __y18n('Tuesday'), __y18n('Wednesday'), __y18n('Thursday'), __y18n('Friday'), __y18n('Saturday')
    ],
    monthNames: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
        __y18n('January'), __y18n('February'), __y18n('March'), __y18n('April'), __y18n('May'), __y18n('June'), __y18n('July'), __y18n('August'), __y18n('September'), __y18n('October'), __y18n('November'), __y18n('December')
    ],
    timeNames: [
        'a', 'p', 'am', 'pm', 'A', 'P', 'AM', 'PM'
    ]
};
Date.prototype.withoutTime = function () {
    var d = new Date(this);
    d.setHours(0, 0, 0, 0);
    return d;
}


const app = express();

// mongodb setup
mongoose.connect(dbConfig.url, { useMongoClient: true });
mongoose.connection.on('error', () => {
    console.log('Could not connect to database. Exiting now...');
    process.exit();
});
mongoose.connection.once('open', () => { console.log('Successfully connected to database'); });

// middleware for easy file uploading
app.use(fileUpload());

// use session for user authentication tracking
app.use(session({
    secret: 'sbtoptoptop123__=+691',
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

app.use(cookieParser('sbsbsbsoneloveasd7563289__=1+=1-cvxpiew28'));

// get session access from any place on template
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// use non standard request methods
app.use(methodOverride('_method'));

// serve static files from template
app.use(express.static('public'));

// set hbs as default template engine
app.locals.__ = __y18n;
app.set('view engine', 'ejs');

// set uniqid generator available from everywhere
app.locals.uniqid = require('uniqid');

const striptags = require('striptags');
// limit post card description text
app.locals.cropText = (text) => {
    text = striptags(text, '<strong><em><strike><a><img>');
    var length = 255;
    if(text.length > length) return text.substring(0, length) + '...';
    else return text;
};

// date format
app.locals.dateformat = dateformat;

// include routes
app.use('/user', require('./app/routes/user.routes'));
app.use('/post', require('./app/routes/post.routes'));
app.use('/vote', require('./app/routes/vote.routes'));
app.use('/search', require('./app/routes/search.routes'));

// home page
app.get('/', (req, res) => {
    require('./app/models/country.model').find({}, (err, countries) => {
        return res.render('index', { countries: countries });
    });
});

app.post('/back', (req, res) => {
    return res.redirect('back');
});

app.get('/cc', (req, res) => {
    require('./app/models/country.model').create({ name: 'russia', img: 'imgs/countries/russia.jpg' }, (err, countries) => {
        return res.render('index', { countries: countries });
    });
});

// print all errors to console
app.use((err, req, res, next) => {
    console.error(err.stack);
    next(err);
});

// handle errors
app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error.ejs', { error: err.message });
});

// start server
app.listen(3000, () => {
    console.log('tour-app is listening on port 3000');
});