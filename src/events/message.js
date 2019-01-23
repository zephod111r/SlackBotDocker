import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { getCard } from '../utils/card';

const handleEvent = (params) => {
	const cards = params.text.match(/\{\{(.+)\}\}/g).map(check => check.replace(/[{}]/g, ''))

	cards.forEach(card => {
		getCard(card).then(data => {
			fetch(`https://hooks.slack.com/services/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`, { 
				method: 'post',
				headers: {
					'Content-type': 'application/json'
				},
				body: JSON.stringify(data)
			})
		})
	})

	return Promise.resolve({maches: cards});
}

export {
	handleEvent
};
