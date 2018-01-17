// Helpers

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

// Core
const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const dbConfig = require('./config/database.config');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);


const app = express();


// mongodb
mongoose.connect(dbConfig.url, {
    useMongoClient: true
});


mongoose.connection.on('error', () => {
    console.log('Could not connect to database. Exiting now...');
    process.exit();
});

mongoose.connection.once('open', () => {
    console.log('Successfully connected to database');
});


// app internationalization || localization
app.locals.__ = require('y18n')({ locale: 'en_US' }).__;


// use session for login tracking
app.use(session({
    secret: 'sbtoptoptop123__=+691',
    resave: true,
    saveUninitialized: false,
    store: new MongoStore({
        mongooseConnection: mongoose.connection
    })
}));
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});
// parse incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// use non standard request methods
app.use(methodOverride('_method'));
// set ejs as default template engine
app.set('view engine', 'ejs');
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


app.get('/', (req, res) => {
    res.render('index.ejs');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    next(err);
});

app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.send(err.message);
});

app.listen(3000, () => {
    console.log('tour-app is listening on port 3000');
});