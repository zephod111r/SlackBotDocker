import fetch from 'node-fetch';
import { findCards, mapParams } from '../utils/find';

const get = (params) => {
	const searchParams = mapParams(params.text)
	const searchPromise = findCards(searchParams, 0)
	
	if (params.response_url) {
		searchPromise.then(response => {
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
					text: safeMessage(err.message)
				}]
			})
		}))
		return Promise.resolve({
			text: `Searching with ${searchParams.join(', ')}...`
		})
	}
	
	return searchPromise;
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
