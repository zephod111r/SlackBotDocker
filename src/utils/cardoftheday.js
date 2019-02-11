import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { log } from '../utils';
import { BASE_URI, CODE } from './constants';

const newUri = `${BASE_URI}/CardOfTheDayNew`
const showUri = `${BASE_URI}/CardOfTheDayShow`
const scoreUri = `${BASE_URI}/CardOfTheDayScore`
const guessUri = `${BASE_URI}/CardOfTheDayGuess`

const cardOngoing = 'Card of the day still on going!';
const cardUsed = 'Users can only attempt additional CotD once per day!';
const cardGuessFail = 'Failed to guess correctly!';
const cardGuessNone = 'No Card of the day to guess! Try /CotD new';

export const resolveUser = (user) => {
	return fetch(`https://slack.com/api/users.info?user=${user.toUpperCase()}&token=${process.env.SLACK_BOT_TOKEN}`, { method: 'get' })
		.then(res => res.json())
		.then(data => {
			return data.ok ? data.user.real_name : user
		})
}
export const newCard = (user, channel) => {
	if(!CODE) {
		return Promise.resolve({
			text: 'No code installed, cannot retrieve card details'
		})
	}

	return fetch(`${newUri}?code=${CODE}&user=${encodeURIComponent(user)}&channel=${channel}`, { method: 'get' })
		.then(res => {
			if(res.status > 201) {
				return res.text()
			} else {
				return res.json()
			}
		})
		.then(data => {
			if(data === cardOngoing) {
				return showCard(channel, 'Cotd is already running, guess that card!');
			} else if (data === cardUsed) {
				return noCotd('You have already used your COTD today!');
			} else {
				return getCotd(data.image);
			}
		})
		.catch(err => {
			log.error(err);
			return {
				title: `Error creating new cotd`,
				text: `*error*, ${err.message}`,
		    	response_type: "in_channel",
			}
		})
}

export const currentScore = (channel) => {
	if(!CODE) {
		return Promise.resolve({
			text: 'No code installed, cannot retrieve card details'
		})
	}

	return fetch(`${scoreUri}?code=${CODE}&channel=${channel}`, { method: 'get' })
		.then(res => {
			if(res.status >= 400) {
				return res.text()
			} else {
				return res.json()
			}
		})
		.then(data => {
			const arr = data || [];
			const dataMap = Promise.all(arr.map(player => 
				resolveUser(player.name).then(name => ({
					title: name,
					text: `*${player.correct}* (${Math.round((player.correct / (player.correct + player.fails)) * 100)}% accuracy)`
				}))
			))

			return dataMap.then(attachments => ({
		    	response_type: "in_channel",
				text: 'Current scores:',
				attachments
			}));
		})
		.catch(err => {
			log.error(err);
			return {
				title: `Error guessing cotd`,
				text: `*error*, ${err.message}`,
		    	response_type: "in_channel",
			}
		})
}

export const guessCard = (user, channel, guess) => {
	if(!CODE) {
		return Promise.resolve({
			text: 'No code installed, cannot retrieve card details'
		})
	}

	return fetch(`${guessUri}?code=${CODE}&user=${encodeURIComponent(user)}&channel=${channel}&guess=${encodeURIComponent(guess)}`, { method: 'get' })
		.then(res => {
			return res.text()
		})
		.then(data => {
			if(data === cardGuessFail) {
				return badGuess(guess);
			} else if (data === cardGuessNone) {
				return noGuess(guess);
			} else {
				return goodGuess(guess);
			}
		})
		.catch(err => {
			return {
				title: `Error guessing cotd`,
				text: `*error*, ${err.message}`,
		    	response_type: "in_channel",
			}
		})
}

export const getCurrentCardData = (channel) => {
	if(!CODE) {
		return Promise.resolve({
			text: 'No code installed, cannot retrieve card details'
		})
	}

	return fetch(`${showUri}?code=${CODE}&channel=${channel}`, { method: 'get' })
		.then(res => {
			if(res.status >= 400) {
				return res.text()
			} else {
				return res.json()
			}
		})
}

export const showCard = (channel, message = 'Guess that card!') => {
	if(!CODE) {
		return Promise.resolve({
			text: 'No code installed, cannot retrieve card details'
		})
	}

	return getCurrentCardData(channel)
		.then(data => {
			if(typeof data === 'string') {
				return noCotd();
			} else {
				const set = data.sets.find(set => set.image)
				return getCotd(set.cropped, message);
			}
		})
		.catch(err => {
			log.error(err);
			return {
				title: `Error showing cotd`,
				text: `*error*, ${err.message}`,
		    	response_type: "in_channel",
			}
		})
}

const noGuess = (guess) => {
	return {
		text: `No CoTD active, start a new one with /cotd new`,
    	response_type: "in_channel"
	}
};
const goodGuess = (guess) => {
	return {
		text: `Guess *${guess}*: Correct!`,
    	response_type: "in_channel"
	}
};
const badGuess = (guess) => {
	return {
		text: `Guess *${guess}*: Incorrect, try again!`,
    	response_type: "in_channel"
	}
};
const noCotd = (text = 'No cotd active yet') => {
	return {
		text: `*Failed*, ${text}`,
    	response_type: "in_channel"
	}
};
const getCotd = (image, text = 'Guess that card!') => {
	return {
		text,
    	response_type: "in_channel",
    	attachments: [{
			title: 'COTD',
	        image_url: image ? image.replace("https://", "http://") : '',
	    }]
	}
};