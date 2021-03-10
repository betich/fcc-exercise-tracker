const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/users');
const Exercise = require('./models/exercises');

mongoose.connect(process.env.DBURL, { useNewUrlParser: true, useUnifiedTopology: true })
.then(() => {
	console.log("DB connected");
}).catch((err) => {
	console.error("Connection failed");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// mongodb+srv://user:user@exercise-tracker.dgeuz.mongodb.net/exercise-tracker?retryWrites=true&w=majority

app.use(cors());
app.use(express.static('public'));
app.get('/', (req, res) => {
	res.sendFile(__dirname + '/views/index.html');
});

function sendErr (res, err) {
	res.send("there was an error");
	console.error(err);
}
// Routes

app.post('/api/exercise/new-user', async (req, res) => {
	// create a new user
	const foundUser = await User.findOne({ username: req.body.username })
	if (foundUser) {
		return res.json({
			_id: foundUser._id,
			username: foundUser.username
		});
	}

	User.create({ username: req.body.username })
		.then((createdUser) => {
			res.json({
				_id: createdUser._id,
				username: createdUser.username
			});
		})
		.catch((err) => sendErr(res, err))
})

app.post('/api/exercise/add', (req, res) => {
	// create a new exercise
	let date = new Date(req.body.date);
	if (!date) return res.send("invalid date");
	else if (date > new Date()) return res.send("that date hasn't even happened yet")

	Exercise.create({
		user: req.body.userId,
		date: date,
		duration: req.body.duration,
		description: req.body.description
	})
	.then((exp) => {
		res.json({
			_id: exp._id,
			user: exp.userId,
			date: exp.date.toUTCString(),
			duration: exp.duration,
			description: exp.description
		});
	})
	.catch((err) => sendErr(res, err))
})

app.get('/api/exercise/log', (req, res) => {
	// queries: {userId}[&from][&to][&limit]
	const userId = mongoose.Types.ObjectId(req.query.userId);
	if (!userId) return res.send("specify a user id");

	let from = new Date(-8640000000000000);
	let to = new Date();
	const limit = parseInt(req.query.limit);

	if (req.query.from) {
		from = new Date(req.query.from);
	}
	if (req.query.to) {
		from = new Date(req.query.to)
	}

	let pipeline = [
		{
			$match: {
				user: userId
			}
		},
		{
			$match: {
				date: {
					$gte: from,
					$lte: to
				}
			}
		}
	]

	if (limit) pipeline.push({ $limit: limit });

	Exercise.aggregate(pipeline)
		.then(async (exercises) => {
			if (!exercises) return res.send("can't find any exercises")
			let foundUser = await User.findById(userId);
			res.json({
				_id: foundUser._id,
				username: foundUser.username,
				count: exercises.length,
				log: exercises
			})
		})
		.catch((err) => sendErr(res, err))
})

const listener = app.listen(process.env.PORT || 3000, () => {
	console.log('Your app is listening on port ' + listener.address().port);
})
