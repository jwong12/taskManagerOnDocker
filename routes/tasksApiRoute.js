const express = require('express');
const Tasks = require('../models/Tasks');

const router = express.Router();

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function apiAuthenticationMiddleware(req, res, next) {
	if (req.isAuthenticated()) {
		return next()
	}

	res.status(401).json({error : 'Unauthenticated request'});
}

router.get('/', 
	apiAuthenticationMiddleware, 
	(req, res) => {	
		Tasks.find({ username: req.user.username }, 
			(err, result) => {    
				if(result.length > 0) {
					res.json(result[0].tasks);

				} else {
					res.json(null);
				}
			}
		);
	}
);

router.post('/', 
	apiAuthenticationMiddleware, 
	(req, res) => {
		if(!req.body.task) {
			return res.status(400).json({msg : "Please include a task."});
		};

		const task = req.body;
		const year = task.date.slice(10,15);
		const monthText = task.date.slice(4,7);
		const day = task.date.slice(8,10);

		for (let i = 0; i < MONTHS.length; i++) {
			if (MONTHS[i] === monthText) {
				task.date = new Date(Date.UTC(year, i, day, 12, 0, 0));
				break;
			}
		}

		const query = Tasks.where({ username: req.user.username });
		query.findOne((err, result) => {
			if (err) return handleError(err);
		
			if (result) {
				result.tasks.push(task);
			
			} else {
				result = new Tasks({ username: req.user.username, tasks: [task] });
			}  
		
			result.save((err) => {
				if (err) {
					console.log('Failed to save the Tasks in Mongodb', err);
					return res.status(500).json({ status: 'Failed to save the Tasks' });
				}
			
				res.json({ status: 'Successfully added the Tasks' });
			});
		});
	}
);

router.put('/update/:id', function (req, res) {
	const query = Tasks.where({ username: req.user.username });
	
	query.findOne((err, result) => {
		if (err) return handleError(err);

		if (result) {
			let subdoc = result.tasks.id(req.body._id);
			
			if (req.body.task) {
				subdoc.task = req.body.task;
			} 

			if (req.body.category) {
				subdoc.category = req.body.category;
			} 

			if (req.body.date) {
				subdoc.date = new Date(req.body.date);
			}

			if (req.body.status) {
				subdoc.status = req.body.status;
			} 

			if (req.body.priority) {
				subdoc.priority = req.body.priority;
			}
			
			result.save((err) => {
				if (err) {
					console.log('Failed to update a task in Mongodb', err);
					return res.status(500).json({ status: 'Failed to update a task' });

				} else {
					res.json(null);
				}				
			});			
		}				
	});
});

router.delete('/delete/:id', function (req, res) {
	const query = Tasks.where({ username: req.user.username });
	
	query.findOne((err, result) => {
		if (err) return handleError(err);

		if (result) {
			result.tasks.pull(req.body.id);
			result.save((err) => {
				if (err) {
					console.log('Failed to remove a task in Mongodb', err);
					return res.status(500).json({ status: 'Failed to remove a task' });

				} else {
					res.json(null);
				}
			});			
		}				
	});
});

module.exports = router;
