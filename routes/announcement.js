const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');
const {ensureAuthenticated, ensureAdmin} = require('../helpers/auth') //this is called destructuring
const fs = require('fs');
const moment = require('moment');
const path = require('path')
const favicon = require('serve-favicon');
const PythonShell = require('python-shell');

var log = path.dirname(require.main.filename) + '/logs/users.log';

const mailman = require('../config/mailman');


module.exports = router;

//icon
router.use(favicon('./public/Images/favicon.ico'));

var log = path.dirname(require.main.filename) + '/logs/announcements.log';


router.get('/new',  ensureAdmin,  (req,res) => {
	res.render('announcements/addAnnouncement', {title: 'Announce something - Metu Developers'})
});

require('../models/Announcement');
const Announcement = mongoose.model('Announcement');

router.post('/new',  ensureAdmin,  (req,res) => {
	const newAnnouncement = {
		Title: req.body.title,
		Body:req.body.desc,
		Date: Date.now()
	};
	new Announcement(newAnnouncement)
	.save()
	.then(() => {
		//LOG
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
			"ANNOUNCED:   by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Title: "+ req.body.title +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
		//LOG
	req.flash('success_msg', 'Announcement made.')
	res.redirect('/');
	})
});

router.get('/:id',  ensureAdmin,  (req,res) => {
	Announcement.findOne({_id:req.params.id}).then((Announcement)=>{
		res.render('announcements/editAnnouncement', {Announcement:Announcement,title: 'Edit Announcement - Metu Developers'})
	})
	
});

router.delete('/:id',  ensureAdmin,  (req,res) => {
	Announcement.findOne({_id:req.params.id}).then((Announcement)=>{
		Announcement.remove();
		//LOG
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
			"ANNOUNCEMENT REMOVED:   by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Title: "+ req.body.title +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
		//LOG
		res.redirect('/');
	})
	
});


router.put('/:id',  ensureAdmin,  (req,res) => {
	Announcement.findOne({
		_id: req.params.id
	})
	.then(Announcement =>{ //set new values to the db index
		Announcement.Title=req.body.title;
		Announcement.Body = req.body.desc;
		//LOG
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
			"Announcement EDITED:  by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Announcement: "+ Announcement.Title +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
		//LOG

		Announcement.save()	//save index state and redirect
		.then(() => {
			req.flash('success_msg', 'Announcement properties updated.')
			res.redirect('/');

		})
	})	
	
});
					
router.get('/mail/new',  ensureAdmin,  (req,res) => {
	res.render('announcements/newMassMail', {title: 'Mass Email - Metu Developers'})
});

router.post('/mail/new',  ensureAdmin,  (req,res) => {
	var options = {
		pythonOptions: ['-u'],
	  	args: [mailman.uid, mailman.pwd, mailman.fromAddr, req.body.body  , '--title', req.body.title]
	};
	PythonShell.run(path.dirname(require.main.filename) + '/python/MailSender/MailSender.py', options,(err, results) => {
	  if (err) throw err;
	  // results is an array consisting of messages collected during execution
	  console.log('results: %j', results);
	});
	res.redirect('/');
});