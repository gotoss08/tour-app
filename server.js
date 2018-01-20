const express = require('express');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const methodOverride = require('method-override');
const dbConfig = require('./config/database.config');
const mongoose = require('mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const __y18n = require('y18n')({ locale: 'ru_RU' }).__;

const app = express();

// mongodb setup
mongoose.connect(dbConfig.url, { useMongoClient: true });
mongoose.connection.on('error', () => {
    console.log('Could not connect to database. Exiting now...');
    process.exit();
});
mongoose.connection.once('open', () => { console.log('Successfully connected to database'); });


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

// use express validator
app.use(expressValidator());

// use non standard request methods
app.use(methodOverride('_method'));

// serve static files from template
app.use(express.static('public'));

// set hbs as default template engine
app.locals.__ = __y18n;
app.set('view engine', 'ejs');

// markdown
const marked = require('marked');
const striptags = require('striptags');
app.locals.toMarkdownHelper = (text) => {
    return(marked(striptags(text)));
};

// include routes
app.use('/user', require('./app/routes/user.routes'));
app.use('/post', require('./app/routes/post.routes'));
app.use('/country', require('./app/routes/country.routes'));

// home page
app.get('/', (req, res) => {
    require('./app/models/country.model').find({}, (err, countries) => {
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
    res.send(err.message);
});

// start server
app.listen(3000, () => {
    console.log('tour-app is listening on port 3000');
});