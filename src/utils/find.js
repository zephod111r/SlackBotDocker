import fetch from 'node-fetch';
import { log } from '../utils';
import { BASE_URI, CODE, safeMessage } from './constants';
import { parseSymbols } from './card';

const FindAPIBase = `${BASE_URI}/Search`;
const keys = [
	'name',
	'cmc',
	'ci',
	'text',
	'artist',
	'type',
	'subtype',
	'supertype',
	'setname',
	'setcode',
	'colour',
	'colouridentity',
	'invcolouridentity',
	'power',
	'toughness',
	'types',
	'rarity'
]
const LINE_COUNT = 3;
const PAGE_COUNT = LINE_COUNT * 3;

export const mapParams = text => text
	.split(',')
	.map(query => {
		const keyVal = query.split('=');
		return keyVal.length === 2 ? {key:keyVal[0].trim(), val: keyVal[1].trim()} : null
	})
	.filter(keyVal => !!keyVal && keys.indexOf(keyVal.key) > -1);

export const findCards = (searchParams, page) => {
	if(!CODE) {
		return Promise.resolve({
			text: 'No code installed, cannot search for card'
		})
	}
	if(!searchParams || !searchParams.length) {
		return Promise.resolve({
			text: `No search possible with these parameters, try again with one of these keys: ${keys.join(', ')}`
		})
	}

	const params = searchParams.map(({key, val}) => `${encodeURIComponent(key)}=${encodeURIComponent(val)}`);

	return fetch(`${FindAPIBase}?code=${CODE}&${params.join('&')}`, { method: 'get' })
		.then(res => {
			if(res.status === 404) return Promise.reject('404, no results found');
			return res.json()
		})
		.then(data => {
			if(data.length === 0) return getNoCard(searchParams.map(({key, val}) => `${key}=${val}`));
			return getCards(data, searchParams.map(({key, val}) => `${key}=${val}`), page);
		})
		.catch(err => {
			log.error(err);
			return {
				title: `No results for *${searchParams.map(({key, val}) => `${key}=${val}`).join(', ')}*`,
				text: `*error*, ${safeMessage(err.message)}`,
		    	response_type: "in_channel",
			}
		})
}


const getNoCard = searchParams => {
	return {
    	text: `No match with ${searchParams.join(', ')}. try another search`,
    };
};
const getCards = (data, searchParams, page) => {

	const elements = [];
	if (page > 0) {
		elements.push({
			type: "button",
			//search: searchParams.join(', '),
			text: {
				type: "plain_text",
				text: "Previous page"
			},
			action_id: "find-prev-page",
			value: (page - 1).toString()
		})
	}
	if (data.length > (page+1)*PAGE_COUNT) {
		elements.push({
			type: "button",
			//search: searchParams.join(', '),
			text: {
				type: "plain_text",
				text: "Next page"
			},
			action_id: "find-next-page",
			value: (page + 1).toString()
		})
	}

	const paginated = data.slice(page*PAGE_COUNT, (page+1)*PAGE_COUNT);

	let i=0;
	const blocks = [];
	while(i<paginated.length) {
		const cards = paginated.slice(i, i + LINE_COUNT);

		blocks.push(getCardRow(cards))
		blocks.push(getButtonRow(cards))

		i = i + LINE_COUNT;
	}

	//.map(card => getCard(card));
	if(elements.length) {
		blocks.push({
			"type": "divider"
		})
		blocks.push({
			type: "actions",
			elements
		})
	}

	return {
		text: `${data.length} matches for ${searchParams.join(', ')}`,
    	response_type: "in_channel",
    	blocks
	}
};
const getCard = card => {
	const name = `${card.name} (<http://gatherer.wizards.com/Pages/Card/Details.aspx?name=${encodeURIComponent(card.name)}|Gatherer>)`;
	const mana = parseSymbols(card.manaCost);
	const type = `${card.type} ${card.power ? `(${card.power}/${card.toughness})` : ''}`;
	const text = parseSymbols(card.text);
	const image = card.sets[0].cropped;

	return {
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${name}\n${mana}\n${type}\n${text}`
      },
      accessory: {
        type: "image",
        image_url: image.replace("https://", "http://"),
        alt_text: card.name
      }
    }
}

const getCardRow = cards => {

	const cardIds = cards.map(card => {
		const setInd = 0;
		const id = card.sets[setInd].minature.match(/([^\/]*)\.jpeg/)
		return id && id.length ? id[1] : null;
	}).filter(id => id)

	const img = `https://mtgbot-client.azurewebsites.net/slack/images?ids=${cardIds.join(',')}`

	return {
		"type": "image",
		"image_url": img,
		"alt_text": "cards"
	}
}

const getButtonRow = cards => {
	const elements = cards.map(card => {
		return {
			type: "button",
			text: {
				type: "plain_text",
				text: card.name
			},
            url: `http://gatherer.wizards.com/Pages/Card/Details.aspx?name=${encodeURIComponent(card.name)}`
		}
	})

	return {
		type: "actions",
		elements
	}
}
