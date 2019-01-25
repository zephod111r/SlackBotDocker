import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { getCard } from '../utils/card';
import { postMessage } from '../utils/bot';

const handleEvent = (params) => {
	const cards = params.text.match(/\{\{(.+?)\}\}/g).map(check => check.replace(/[{}]/g, ''))

	postMessage({
		text: `searching for ${cards.map(card=>`*${card}*`).join(', ')}`,
		channel: params.channel.name ? params.channel.name : params.channel,
	});

	cards.forEach(card => {
		getCard(card).then(data => {
			const fullData = Object.assign({}, data, {
				channel: params.channel.name ? params.channel.name : params.channel,
			});

			postMessage(fullData);
		})
	})

	return Promise.resolve();
}

export {
	handleEvent
};
