import fetch from 'node-fetch';
import { newCard, showCard, getCurrentCardData } from '../utils/cardoftheday';

const generate = (params) => {
	const cotdPromise = newCard(params.user_id, params.channel_id);

	console.log('CHANNEL ID', params)

	if (params.response_url) {
		cotdPromise.then(response => {
			fetch(params.response_url, {
				method: "POST",
				headers: {
					"Content-type": "application/json"
				},
				body: JSON.stringify(response)
			})
		}, err => fetch(params.response_url, {
			method: "POST",
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify({
				text: "Sorry something went wrong :(",
				attachments: [{
					text: err.message
				}]
			})
		}))
		return Promise.resolve({
			text: `Checking for new card...`
		})
	}
	
	return cotdPromise;
}
const guess = (params) => {
	return Promise.resolve({
    	text: `${params.text}: Incorrect, sucker!`,
    	response_type: "in_channel"
	});
}
const score = (params) => {
	return Promise.resolve({
    	text: "Andrew is winning",
    	response_type: "in_channel"
	});
}

const hintMap = [
	data => `CMC is ${data.convertedManaCost}`,
	data => `type is ${data.types.join(', ')}`,
	data => `Colour identity is ${data.colorIdentity.length ? data.colorIdentity.join('') : 'Colourless'}`,
	data => `Rarity is ${data.rarity}`,
	data => `Was is the set ${data.sets[0].setname}`,
]
const hint = (params) => {
	const cotdPromise = getCurrentCardData(params.channel_id).then(data => {
		if (typeof data === 'string') {
			return Promise.resolve({
				text: '*Failed*, No COTD active to give a hint',
    			response_type: "in_channel"
			})
		} else {
			const ind = Math.floor(Math.random() * 5);
			return Promise.resolve({
				text: `*COTD Hint!* ${hintMap[ind](data)}`,
    			response_type: "in_channel"
			})
		}
	})

	if (params.response_url) {
		cotdPromise.then(response => {
			fetch(params.response_url, {
				method: "POST",
				headers: {
					"Content-type": "application/json"
				},
				body: JSON.stringify(response)
			})
		}, err => fetch(params.response_url, {
			method: "POST",
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify({
				text: "Sorry something went wrong :(",
				attachments: [{
					text: err.message
				}]
			})
		}));

		return Promise.resolve({
			text: `Checking for current card...`
		})
	}
	return cotdPromise;
}
const show = (params) => {
	const cotdPromise = showCard(params.channel_id);

	if (params.response_url) {
		cotdPromise.then(response => {
			fetch(params.response_url, {
				method: "POST",
				headers: {
					"Content-type": "application/json"
				},
				body: JSON.stringify(response)
			})
		}, err => fetch(params.response_url, {
			method: "POST",
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify({
				text: "Sorry something went wrong :(",
				attachments: [{
					text: err.message
				}]
			})
		}))
		return Promise.resolve({
			text: `Checking for new card...`
		})
	}
	
	return cotdPromise;
}

const cotdMap = {
	'new': props => generate(props),
	'score': props => score(props),
	'show': props => show(props),
	'hint': props => hint(props),
	'default': props => guess(props)
}


const handleCommand = (params) => {
	const trimmed = params.text.trim();
	return (cotdMap[trimmed] ? cotdMap[trimmed] : cotdMap['default'])(params)
}

export {
	handleCommand
};
