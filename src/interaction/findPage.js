import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { findCards, mapParams } from '../utils/find';
import { postMessage } from '../utils/bot'
import { safeMessage } from '../utils/constants'

const handleInteraction = ({actions, original_message, channel, message_ts, response_url}) => {
	const page = actions[0].value;
	const search = actions[0].search;

	const searchParams = mapParams(params.text)
	const searchPromise = findCards(searchParams, 0)

	if (response_url) {
		searchPromise.then(response => {
			fetch(response_url, {
				method: "POST",
				headers: {
					"Content-type": "application/json"
				},
				body: JSON.stringify(response)
			})
		}, err => fetch(response_url, {
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
			text: `Loading page *${page}* for search ${searchParams.join(',')}...`
		})
	}

	return searchPromise;
}

export {
	handleInteraction
};
