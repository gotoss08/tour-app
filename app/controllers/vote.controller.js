const Option = require('../models/vote.model').Option;
const Vote = require('../models/vote.model').Vote;
const uniqid = require('uniqid');

module.exports.removeAll = (req, res, next) => {
	Option.remove({}, (err) => {
		if (err) return next(err);
	});
};

module.exports.printAll = (req, res, next) => {
	Option.find({}, (err, options) => {
		if (err) return next(err);
		else {
			console.log(`------ ${options.length} ------`);
			for(let i = 0; i < options.length; i++) {
				let option = options[i];
				console.log(`  + Vote Option: ${option.name}(${option._id})`);
			}
			console.log('------ end ------');
		} 
	});
};

module.exports.create = (req, res, next) => {

};

module.exports.optionCreate = (req, res, next) => {
	if(req.body.name) {
		console.log('option name: ' + req.body.name);

		const id = uniqid();

		Option.create({ _id: id, name: req.body.name }, (err, option) => {
			if (err) return next(err);

			return res.send(option._id);
		});
	} else {
		return res.status(500).send('Vote option name could not be null.');
	}
};

module.exports.optionRemove = (req, res, next) => {
	if(req.body.id) {
		console.log('option id: ' + req.body.id);

		Option.find({ _id: req.body.id }).remove().exec((err) => {
			if (err) return next(err);
			else return res.sendStatus(200);
		});
	} else {
		return res.status(500).send('Vote option id could not be null.');
	}
};

module.exports.optionUpdate = (req, res, next) => {
	if(req.body.id && req.body.name) {
		console.log('option id: ' + req.body.id);
		console.log('option name: ' + req.body.name);

		Option.findByIdAndUpdate(req.body.id, { name: req.body.name }, { new: true }, (err, option) => {
			if (err) return next(err);
			else return res.status(200).send(option.name);
		});
	} else {
		return res.status(500).send('Vote option id could not be null.');
	}
};
