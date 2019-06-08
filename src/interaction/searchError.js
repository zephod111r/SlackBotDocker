import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { getCard } from '../utils/card';
import { postMessage } from '../utils/bot'
import { safeMessage } from '../utils/constants'

const handleInteraction = ({actions, original_message, channel, message_ts, response_url}) => {
	const card = actions[0].selected_options[0].value;
	const cardPromise = getCard(card)

	if (response_url) {
		cardPromise.then(response => {
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
			text: `Loading *${card}*...`
		})
	}

	return cardPromise;
}

export {
	handleInteraction
};
