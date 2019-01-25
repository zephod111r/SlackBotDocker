import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { getCard } from '../utils/card';
import { postMessage } from '../utils/bot'

const handleInteraction = ({actions, original_message, channel, message_ts, response_url}) => {
	const set = actions[0].selected_options[0].value;
	const card = actions[0].name;
	const cardPromise = getCard(card, set)

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
					text: err.message
				}]
			})
		}))
		return Promise.resolve({
			text: `Loading *${card}* from *${set}*...`
		})
	}

	return cardPromise;
}

export {
	handleInteraction
};
