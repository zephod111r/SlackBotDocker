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
		})
		return Promise.resolve({
			text: "Searching..."
		})
	}
	else return cardPromise;
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
