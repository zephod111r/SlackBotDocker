import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { getCard } from '../utils/card';

const handleInteraction = ({actions, original_message, response_url}) => {
	const set = actions[0].selected_options[0].value;
	const card = actions[0].name;

	console.log(card, set)

	getCard(card, set).then(data => {

		const fullData = Object.assign({}, data, {
			replace_original: true
		});

		fetch(response_url, {
			method: "POST",
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify(fullData)
		})
	})

	return Promise.resolve({})
}

export {
	handleInteraction
};
