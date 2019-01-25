import fetch from 'node-fetch';
import { getCard } from '../utils/card';

const get = (params) => {
	const cardPromise = getCard(params.text);
	
	if (params.response_url) {
		cardPromise.then(response => {
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
			text: `Searching for ${params.text}...`
		})
	}
	
	return cardPromise;
}

const cardMap = {
	'default': props => get(props)
}

const handleCommand = (params) => {
	const trimmed = params.text.trim();
	return (cardMap[trimmed] ? cardMap[trimmed] : cardMap['default'])(params)
}

export {
	handleCommand
};
