const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const dbConfig = require('./config/database.config');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const hbs = require('express-handlebars');
const __y18n = require('y18n')({ locale: 'en_US' }).__;

const app = express();

// set hbs as default template engine
app.engine('hbs', hbs({
    extname: 'hbs',
    defaultLayout: 'layout',
    layoutsDir: __dirname + '/views/layouts/',
    helpers: {
        '__': (key) => {
            return __y18n(key); // internationalization with y18n
        },
        'session': () => { return res.locals.session; }
    }
}));
app.set('view engine', 'hbs');


// mongodb setup
mongoose
    .connect(dbConfig.url, {
        useMongoClient: true
    })
    .connection.on('error', () => {
        console.log('Could not connect to database. Exiting now...');
        process.exit();
    })
    .connection.once('open', () => {
        console.log('Successfully connected to database');
    });


// use session for user authentication tracking
app.use(session({
    secret: 'sbtoptoptop123__=+691',
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));

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

// markdown
const marked = require('marked');
const striptags = require('striptags');
app.locals.toMarkdownHelper = (text) => {
    return(marked(striptags(text)));
};

// include routes
const userRoutes = require('./app/routes/user.routes');
app.use('/user', userRoutes);

// home page
app.get('/', (req, res) => {
    res.render('index');
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