const express = require('express')
const router = express.Router();
const mongoose = require('mongoose');
const {ensureAuthenticated, ensureAdmin, ensureVerified} = require('../helpers/auth') //this is called destructuring
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const favicon = require('serve-favicon');

var log = path.dirname(require.main.filename) + '/logs/stock.log';

module.exports = router;

//icon
router.use(favicon('./public/Images/favicon.ico'));
router.get('/edit/favicon.ico', (req,res) =>{
	res.status(204);
})
router.get('/requests/favicon.ico', (req,res) =>{
	res.status(204);
})
router.get('/requests/approve/favicon.ico', (req,res) =>{
	res.status(204);
})
router.get('/requests/revoke/favicon.ico', (req,res) =>{
	res.status(204);
})
router.get('/requests/return/favicon.ico', (req,res) =>{
	res.status(204);
})
router.get('/requests/delete/favicon.ico', (req,res) =>{
	res.status(204);
})


require('../models/Item');
const Item = mongoose.model('Item');
require('../models/Request');
const Request = mongoose.model('Request');


router.get('/', ensureAuthenticated, (req,res) => {
	Item.find({})
	.sort({dateAdded: -1})
	.then(Items =>{
		res.render('stock/Items',{ 	//pass Projects to the page into tag with the name "Projects"
			Items: Items,
			title: 'Community Stash - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main'
		})
	})
});

router.get('/requestToStock', ensureVerified, (req,res) => {
	res.render('stock/requestToStock', {title: 'Request Form for Stock Addition',
      layout: res.locals.bMobile ? 'mobile' : 'main'})
});

router.post('/requestToStock', ensureVerified, (req,res) => {
	const newRequest = {
		ItemName: req.body.name,
		Quantity:req.body.quantity,
		Info:req.body.info,
		Date: Date.now(),
		ToStock:true,
		Pending:true,
		User:req.user.userID,
		Time:0,
		Permanent:true

	};
	new Request(newRequest)
	.save()
	.then(() => {
		//LOG
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
			"ITEM REQUESTED TO STOCK:   by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+
			", Item: "+ req.body.name +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
		//LOG
		req.flash('success_msg', 'Request Form Sent.');
		res.redirect('/stock');
	})
	res.redirect('/stock/');
});

router.get('/stockRequests', ensureAdmin, (req,res) => {
	Request.find({ToStock:true})
	.then(Requests =>{
			res.render('stock/requests', {Requests:Requests,title: 'Stock Requests - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main'});
	})
	
});


router.get('/new', ensureAdmin,  (req,res) => {
	res.render('stock/addItem',{title: 'New Item - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main'})
});

router.post('/new', ensureAdmin,  (req,res) => {
	const newItem = {
		name: req.body.name,
		ItemID:req.body.id,
		quantity:req.body.quantity,
		category:req.body.category,
		dateAdded: Date.now()	
	};
	new Item(newItem)
	.save()
	.then(() => {
		//LOG
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
			"ITEM ADDED:   by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+
			", Item: "+ req.body.name + " ("+ req.body.id +")" +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
		//LOG
		req.flash('success_msg', 'New Item added.');
		res.redirect('/stock');
	})
});


router.get('/edit/:id', ensureAdmin,  (req,res) => { 
	Item.findOne({//returns only 1 result
		_id: req.params.id
	})
	.then(Item =>{
			res.render('stock/editItem',{
			Item:Item,
			title: 'Edit '+ Item.name + ' (' + Item.itemID + ') - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main' 	
		});	
	})
});


router.put('/:id', ensureAdmin,  (req,res) =>{
	Item.findOne({
		_id: req.params.id
	})
	.then(Item =>{ //set new values to the db index
		Item.name = req.body.name,
		Item.itemID = req.body.id,
		Item.quantity = req.body.quantity,
		Item.category = req.body.category,

		Item.save()	//save index state and redirect
		.then(() => {
			//LOG
			fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
				"ITEM UPDATED: by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+
				", Item: "+ req.body.name + " ("+ req.body.id +")" +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
			//LOG
			req.flash('success_msg', 'Item properties updated.')
			res.redirect('/stock/');

		})
	})	
})

router.delete('/:id',  ensureAdmin,  (req,res) => {	//DELETE request 
	
	Item.findOne({
		_id:req.params.id
	}).then(Item =>{
		//LOG
		fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
		"ITEM REMOVED: by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+", Item: "+ Item.name + " ("+ Item.itemID +")"+ " >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
		//LOG
	})

	Item.remove({
		_id:req.params.id
	})
	.then(() =>{
		req.flash('success_msg', 'Item deleted.')
		res.redirect('/stock/')
			})
});











///////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////STOCK REQUESTS AND REQUEST FORMS

router.get('/request/:id',ensureVerified,  (req,res) => { 
	Item.findOne({//returns only 1 result
		_id: req.params.id
	})
	.then(Item =>{
			res.render('stock/requestItem',{Item:Item, title: 'Item Request Form - Metu Developers',
      layout: res.locals.bMobile ? 'mobile' : 'main'});	
	})
});



router.post('/request/:id',ensureVerified, (req,res) =>{
	Item.findOne({
		_id: req.params.id
	})
	.then(Item =>{
		if(!req.body.perma) req.body.perma=false;
		const newRequest = {
			Item: req.params.id,
			ItemName: (Item.itemID)? Item.name + " (" +Item.itemID+")" : Item.name,
			Quantity: req.body.quantity,
			Time: req.body.return,
			Info: (req.body.project)? req.body.info + "\r\nProject Name: " + req.body.project : req.body.info,
			User: req.user.userID,
			Pending: true,
			Date: Date.now(),
			Permanent: req.body.perma	
		};
		new Request(newRequest)
		.save()
		.then(() => {
			//LOG
			fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
				"ITEM REQUEST:   by "+ req.user.userID +
				", Item: "+ Item.name + " ("+ Item.itemID +")\r\n",(err)=>{if(err) console.log(err);});
			//LOG
			req.flash('success_msg', 'Request Form Sent.');
			res.redirect('/stock');
		})
	});
})

router.get('/requests', ensureAdmin, (req,res) => {
	Request.find({ ToStock: {$ne: true} })
	.sort({Pending: -1, Returned: 1, Date: -1})
	.then(Requests =>{
		var i, pending=0,other=0;
		var now= Date.now();
		for(i=0;i<Requests.length;i++)
		{

			if(Requests[i].Pending)
			{
				Requests[i].timeago = moment(Requests[i].Date).fromNow(true);
				pending++;
			}else{
				other++;
				Requests[i].timeago = moment(Requests[i].DADate).fromNow();
				Requests[i].returnDate = moment(Requests[i].DADate).add(Requests[i].Time, 'days');
				if(Requests[i].returnDate > now)
					Requests[i].overdue = 0;
				else {
					Requests[i].overdue = 1;
					Requests[i].overdueAmount = moment(Requests[i].returnDate).fromNow(true);
				}
			}	
		}
		var complete = ((other)/(other+pending))*100;
		if (complete > 99) complete=0;
		res.render('stock/requests',{ 	//pass Projects to the page into tag with the name "Projects"
			Requests: Requests,
			title: 'Request List - Metu Developers',
			Bar_Percent: complete,
			Bar_Text: 'Pending',
			Bar_Style: ' progress-bar-striped progress-bar-animated bg-success',
      layout: res.locals.bMobile ? 'mobile' : 'main'
		})
	})
});

router.get('/requests/approve/:id', ensureAdmin,  (req,res) =>{
	Request.findOne({
		_id: req.params.id
	})
	.then(Request =>{ //set new values to the db index
		Item.findOne({_id:Request.Item}).then((Item)=>{
			if(Request.Permanent) Item.quantity = Item.quantity - Request.Quantity;
			Item.inStock=Item.inStock-Request.Quantity;
			Item.save();
		})

		Request.Pending = false;
		Request.Approved = true;
		Request.DADate = Date.now();
		Request.DAUser = req.user.userID;

		Request.save()	//save index state and redirect
		.then(() => {
			//LOG
			fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
				"REQUEST APPROVED: by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+
				", Item: "+ Request.ItemName +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
			//LOG
			//req.flash('success_msg', 'Request Approved.');
			res.redirect('/stock/requests');

		})
	})	
})

router.get('/requests/revoke/:id', ensureAdmin,  (req,res) =>{
	Request.findOne({
		_id: req.params.id
	})
	.then(Request =>{ //set new values to the db index
		Item.findOne({_id:Request.Item}).then((Item)=>{
			if(Request.Approved && !Request.Returned){
				if(Request.Permanent) Item.quantity=Number(Item.quantity)+Number(Request.Quantity);
				Item.inStock=Number(Item.inStock)+Number(Request.Quantity);
				Item.save();
			}
			Request.Pending = true;
			Request.Approved = false;
			Request.Declined = false;
			Request.Returned = false;
			Request.DADate = Date.now();

			Request.save()//save index state and redirect
			.then(() => {
				//LOG
				fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
					"REQUEST REVOKED: by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+
					", Item: "+ Request.ItemName +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
				//LOG
				//req.flash('success_msg', 'Request Revoked.');
				res.redirect('/stock/requests');

			})
		})
	})	
})

router.get('/requests/return/:id', ensureAdmin,  (req,res) =>{
	Request.findOne({
		_id: req.params.id
	})
	.then(Request =>{ 
		Item.findOne({_id:Request.Item}).then((Item)=>{
			Item.inStock=Number(Item.inStock)+Number(Request.Quantity);
			Item.save();
		})

		Request.Pending = false;
		Request.Approved = true;
		Request.Declined = false;
		Request.Returned = true;
		Request.DADate = Date.now();

		Request.save()	//save index state and redirect
		.then(() => {
			//LOG
			fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
				"ITEM RETURN CONFIRMED: by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+
				", Item: "+ Request.ItemName +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
			//LOG
			//req.flash('success_msg', 'Request Revoked.');
			res.redirect('/stock/requests');

		})
	})	
})

router.get('/requests/delete/:id',ensureAuthenticated, (req,res) =>{
	Request.findOne({
		_id: req.params.id
	})
	.then(Request =>{ 
			if(req.user.admin || Request.User == req.user.userID)
			{
				Request.remove({_id: req.params.id});
				//LOG
				fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
					"REQUEST DELETED: by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+
					", Item: "+ Request.ItemName +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
				//LOG
				//req.flash('success_msg', 'Request Revoked.');
			}
			if(req.user.admin)
			{
				res.redirect('/stock/requests');
			}else res.redirect('/user/'+req.user.userID);

		})
	})	


router.post('/requests/decline/:id', ensureAdmin,  (req,res) =>{
	Request.findOne({
		_id: req.params.id
	})
	.then(Request =>{ //set new values to the db index

		Request.Pending = false;
		Request.Declined = true;
		Request.DADate = Date.now();
		Request.DAUser = req.user.userID;
		Request.DeclineReason = req.body.reason;

		Request.save()	//save index state and redirect
		.then(() => {
			//LOG
			fs.appendFile(log, "[" + moment().format('YYYY-MM-DD: HH:mm:ss') + "] " + 
				"REQUEST DECLINED: by "+ req.user.userID +" "+req.user.name +" "+req.user.surname+
				", Item: "+ Request.ItemName +" >>>IP: "+ req.connection.remoteAddress +"\r\n",(err)=>{if(err) console.log(err);});
			//LOG
			//req.flash('success_msg', 'Request Declined.');
			res.redirect('/stock/requests');

		})
	})	
})