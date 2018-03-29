//Check if modules are loaded and save them in variables
const express = require('express');
const exphbs = require('express-handlebars')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const sha256 = require('js-sha256');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const session = require('express-session');


//custom module to hide scavenger hunt links from participants
const hunt = require("./scavenger-private/hunt");

const routes = require("./routes");

//Port number for server
const port = 8080;

//js arrow function////// You wont understand whats below if you dont know what this is.
// (params) =>{
//	functionLogic
//}
//
// creates and arbitrary function, meaning a function that is declered on the run 
//bkz lambda function :https://stackoverflow.com/questions/16501/what-is-a-lambda-function
//
//so app.get( 'link', arrow function ) translates to when you see a get request to website.com'/', do this function.


//connect to mongoose
mongoose.connect('mongodb://localhost/BdTest') 
.then(() => console.log('Mongodb connected...'))//this is called promise
.catch(err => console.log(err));				//throw<->catch	

//Load User Model



//Middlewares
//Middlewares have access to specified object params and can alter them between request and response
//Handlebars
app.engine('handlebars', exphbs({defaultLayout: 'main'})); //main.handlebars will be loaded on every page
app.set('view engine', 'handlebars');
//Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
//method override
app.use(methodOverride('_method'));
//session
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: true,
}))
//flash
app.use(flash());




//listener
app.listen(port, () =>{
	console.log(`Server started on port ${port}`);
});



//custom flash middleware for pop up messages
app.use(function(req,res,next){
	res.locals.success_msg = req.flash('success_msg');
	res.locals.error_msg = req.flash('error_msg');
	res.locals.error = req.flash('error');
	next();
});


//Get routes for Scavenger Hunt levels MUST NOT BE PUBLISHED!
hunt.getlevels(app);
//Get other routes from routes.js module
routes.addRoutes(app);

const projects = require('./routes/projects');
const user = require('./routes/user');

app.use('/projects', projects);
app.use('/user', user);