const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');
const {ensureAuthenticated, ensureAdmin, ensureVerified} = require('../helpers/auth') //this is called destructuring
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const favicon = require('serve-favicon');
var log = path.dirname(require.main.filename) + '/logs/projects.log';
var fsPath = require('fs-path');
const fileUpload = require('express-fileupload');
router.use(fileUpload());

module.exports = router;

//icon
router.use(favicon('./public/Images/favicon.ico'));
router.get('/details/favicon.ico', (req,res) =>{
	res.status(204);
})
router.get('/edit/favicon.ico', (req,res) =>{
	res.status(204);
})




require('../models/Project');
const Project = mongoose.model('Project');


router.get('/',ensureVerified, (req,res) => {
	if(req.user.admin)
	{
		Project.find()
		.sort({date:'desc'})
		.then(Projects =>{
			for(i=0;i<Projects.length;i++)//add timeago and time tag to all of the Projects
		    {
		        Projects[i].timeago = moment(Projects[i].date).fromNow();
		        Projects[i].time = moment(Projects[i].date).format('MMMM Do YYYY');
		    }
			res.render('projects/Projects',{ 	//pass Projects to the page into tag with the name "Projects"
				Projects:Projects,
				Host: req.headers.host,
				title: 'Ongoing Projects - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main'
			})
		})
	}else{
		Project.find({active:true})
		.sort({date:'desc'})
		.then(Projects =>{
			for(i=0;i<Projects.length;i++)//add timeago and time tag to all of the Projects
		    {
		        Projects[i].timeago = moment(Projects[i].date).fromNow();
		        Projects[i].time = moment(Projects[i].date).format('MMMM Do YYYY');
		    }
			res.render('projects/Projects',{ 	//pass Projects to the page into tag with the name "Projects"
				Projects:Projects,
				Host: req.headers.host,
				title: 'Ongoing Projects - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main'
			})
		})
	}
});

router.get('/edit/:id/', ensureAdmin,  (req,res) => { 
	Project.findOne({//returns only 1 result
		_id: req.params.id
	})
	.then(Project =>{
		Project.dateformatted = moment(Project.date).format('YYYY-MM-DD');
			res.render('projects/editProject',{
			Project:Project, 	//pass Project to the page into tag with the name "Project"
			title: 'Edit Project' + Project.Title + ' - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main'
		});	
	})
});

router.post('/new', ensureAdmin,  (req,res) => {
	const newProject = {
		Title: req.body.title,
		Description:req.body.desc,
		pdfLink: req.body.pdf,
		gitRepoLink:req.body.github,
		date: req.body.date,
		active:req.body.active
	};
	new Project(newProject)
	.save()
	.then(() => {
		if(req.body.filename)
		{
			req.files.file.mv(path.dirname(require.main.filename) + '/uploaded' + req.body.pdf, req.body.file, (err)=>{
			fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
			"FILE UPLOAD:  by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Filename: "+ req.body.filename +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
			//LOG
			fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
				"PROJECT EDITED:  by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Project: "+ Project.Title +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
			//LOG
			//LOG
			fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
				"PROJECT ADDED:   by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Project: "+ req.body.title +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
			//LOG
			req.flash('success_msg', 'New project added.')
			res.redirect('/projects')
			})
		}else{
			//LOG
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
			"PROJECT ADDED:   by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Project: "+ req.body.title +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
		//LOG
		req.flash('success_msg', 'New project added.')
		res.redirect('/projects')
		}
	})
		
});


router.post('/:id/', ensureAdmin,  (req,res) =>{
	Project.findOne({
		_id: req.params.id
	})
	.then(Project =>{ //set new values to the db index
		Project.Title=req.body.title;
		Project.Description = req.body.Description;
		Project.gitRepoLink = req.body.github;
		Project.date = req.body.date;
		Project.pdfLink = req.body.pdf;
		if(req.body.active) Project.active = req.body.active;
		else Project.active = false;
		if(req.files)
		{
			req.files.file.mv(path.dirname(require.main.filename) + '/uploaded/' + req.body.pdf, (err)=>{
				if (err) console.log(err);
				fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
				"FILE UPLOAD:  by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Filename: "+ req.body.filename +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
				//LOG

				Project.save()	//save index state and redirect
				.then(() => {
					req.flash('success_msg', 'Project properties updated.')
					res.redirect('/projects/');
				});
			})
		}else{
			//LOG
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
			"PROJECT EDITED:  by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Project: "+ Project.Title +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
		//LOG

		Project.save()	//save index state and redirect
		.then(() => {
			req.flash('success_msg', 'Project properties updated.')
			res.redirect('/projects/');
		})
		}	
	})	
})



router.delete('/:id/',  ensureAdmin,  (req,res) => {	//DELETE request 
	//LOG
	Project.findOne({
		_id:req.params.id
	}).then(Project =>{
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
		"PROJECT DELETED: by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Project: "+ Project.Title +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
	})
	//LOG

	Project.remove({
		_id:req.params.id
	})
	.then(() =>{
		req.flash('success_msg', 'Project deleted.')
		res.redirect('/projects/')
			})
});

router.get('/new', ensureAdmin,  (req,res) => {
	res.render('projects/addProject', {title: 'New Project - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main'})
});

router.get('/details/:id/', ensureVerified,  (req,res) => { 
	Project.findOne({_id: req.params.id})
	.then(Project =>{
		Project.dateformatted = moment(Project.date).format('YYYY-MM-DD');
			res.render('projects/ProjectDetails',{
			Project:Project, 	//pass Project to the page into tag with the name "Project"
			title: Project.Title + ' - Metu Developers',
			PDFDir: Project.pdfLink ,
      layout: res.locals.bMobile ? 'mobile' : 'main'
		});	
	})
});

