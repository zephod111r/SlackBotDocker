import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { log } from '../utils';
import { BASE_URI, CODE } from './constants';

const newUri = `${BASE_URI}/CardOfTheDayNew`
const showUri = `${BASE_URI}/CardOfTheDayShow`

const cardOngoing = 'Card of the day still on going!';

export const newCard = (user, channel) => {
	if(!CODE) {
		return Promise.resolve({
			text: 'No code installed, cannot retrieve card details'
		})
	}

	return fetch(`${newUri}?code=${CODE}&user=${user}&channel=${channel}`, { method: 'get' })
		.then(res => {
			console.log(res.status);
			if(res.status === 400) {
				return res.text()
			} else {
				return res.json()
			}
		})
		.then(data => {
			console.log('NEW CARD DATA', data);
			if(data === cardOngoing) {
				return showCard(channel, 'Cotd is already running, guess that card!');
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