import fetch from 'node-fetch';
import { newCard, showCard, getCurrentCardData, guessCard, currentScore } from '../utils/cardoftheday';
import { safeMessage } from '../utils/constants';

const handleResponse = response_url => response => 
	fetch(response_url, {
		method: "POST",
		headers: {
			"Content-type": "application/json"
		},
		body: JSON.stringify(response)
	})

const handleError = (response_url, text) => err => 
	fetch(response_url, {
		method: "POST",
		headers: {
			"Content-type": "application/json"
		},
		body: JSON.stringify({
			text,
			attachments: [{
				text: safeMessage(err.message)
			}]
		})
	})

const generate = (params) => {
	const cotdPromise = newCard(params.user_id, params.channel_id);

	if (params.response_url) {
		cotdPromise.then(
			handleResponse(params.response_url),
			handleError(params.response_url, "Sorry something went wrong :(")
		);
		return Promise.resolve({
			text: `Checking for new card...`
		})
	}
	
	return cotdPromise;
}
const guess = (params) => {
	const guess = params.text.trim();
	const cotdPromise = guessCard(params.user_id, params.channel_id, guess);

	if (params.response_url) {
		cotdPromise.then(
			handleResponse(params.response_url),
			handleError(params.response_url, "Sorry something went wrong :(")
		);
		return Promise.resolve({
			text: `Guessing with *${guess}*...`
		})
	}
	
	return cotdPromise;
}
const score = (params) => {
	const guess = encodeURIComponent(params.text.trim());
	const cotdPromise = currentScore(params.channel_id);

	if (params.response_url) {
		cotdPromise.then(
			handleResponse(params.response_url),
			handleError(params.response_url, "Sorry something went wrong :(")
		);
		return Promise.resolve({
			text: `Getting score...`
		})
	}
	
	return cotdPromise;
}
const show = (params) => {
	const cotdPromise = showCard(params.channel_id);

	if (params.response_url) {
		cotdPromise.then(
			handleResponse(params.response_url),
			handleError(params.response_url, "Sorry something went wrong :(")
		);
		return Promise.resolve({
			text: `Checking for new card...`
		})
	}
	
	return cotdPromise;
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
		cotdPromise.then(
			handleResponse(params.response_url),
			handleError(params.response_url, "Sorry something went wrong :(")
		);
		return Promise.resolve({
			text: `Checking for current card...`
		})
	}
	return cotdPromise;
}
const tellme = (params) => {
	const cotdPromise = getCurrentCardData(params.channel_id).then(data => {
		if (typeof data === 'string') {
			return Promise.resolve({
				text: '*Failed*, No COTD active to give a hint'
			})
		} else {
			return Promise.resolve({
				text: `*COTD is:* ${data.name}`
			})
		}
	})

	if (params.response_url) {
		cotdPromise.then(
			handleResponse(params.response_url),
			handleError(params.response_url, "Sorry something went wrong :(")
		);
		return Promise.resolve({
			text: `Revealing current card...`
		})
	}
	return cotdPromise;
}

const cotdMap = {
	'new': props => generate(props),
	'score': props => score(props),
	'show': props => show(props),
	'hint': props => hint(props),
	'tellmewhatitisinsecret': props => tellme(props),
	'default': props => guess(props)
}


const handleCommand = (params) => {
	const trimmed = params.text.trim();
	return (cotdMap[trimmed] ? cotdMap[trimmed] : cotdMap['default'])(params)
}

export {
	handleCommand
};
