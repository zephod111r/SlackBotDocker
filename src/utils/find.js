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
const PAGE_COUNT = 5;

const testArr = [];
for(let i=0; i<20; i++) {
	testArr.push({
	     variations: null,
	     colorIdentity: [ 'U' ],
	     colors: [ 'U' ],
	     convertedManaCost: 4,
	     layout: 'normal',
	     manaCost: '{3}{U/P}',
	     name: `Tezzeret\'s Gambit (${i})`,
	     originalText: '({PU} can be paid with either {U} or 2 life.)\nDraw two cards, then proliferate. (You choose any number of permanents and/or players with counters on them, then give each another counter of a kind already there.)',
	     originalType: 'Sorcery',
	     power: null,
	     rarity: 'uncommon',
	     subtypes: [],
	     supertypes: null,
	     text: '({U/P} can be paid with either {U} or 2 life.)\nDraw two cards, then proliferate. (You choose any number of permanents and/or playerswith counters on them, then give each another counter of a kind already there.)',
	     toughness: null,
	     type: 'Sorcery',
	     types: [ 'Sorcery' ],
	     image: 'https://data.mtgbot.co.uk/cropped/696381b3-02e6-5f43-91ef-290ca925b8ac.jpeg'
	})
}


export const mapParams = text => text
	.split(',')
	.map(query => {
		const keyVal = query.split('=');
		return keyVal.length === 2 ? {key:keyVal[0].trim(), val: keyVal[1].trim()} : null
	})
	.filter(keyVal => !!keyVal && keys.indexOf(keyVal.key) > -1)
	.map(keyVal => `${keyVal.key}=${keyVal.val}`);

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

	return fetch(`${FindAPIBase}?code=${CODE}&${encodeURIComponent(searchParams.join('&'))}`, { method: 'get' })
		.then(res => {
			if(res.status === 404) return Promise.resolve(testArr);
			return res.json()
		})
		.then(data => {
			if(data.length === 0) return getNoCard(searchParams);
			return getCards(data, searchParams, page);
		})
		.catch(err => {
			log.error(err);
			return {
				title: `No results for *${searchParams.join(', ')}*`,
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
			search: searchParams.join(', '),
			text: {
				type: "plain_text",
				text: "Previous page"
			},
			action_id: "find-prev-page",
			value: page - 1
		})
	}
	if (data.length > (page+1)*PAGE_COUNT) {
		elements.push({
			type: "button",
			search: searchParams.join(', '),
			text: {
				type: "plain_text",
				text: "Next page"
			},
			action_id: "find-next-page",
			value: page + 1
		})
	}

	const blocks = data.slice(page*PAGE_COUNT, (page+1)*PAGE_COUNT).map(card => getCard(card));
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
	const type = `${card.type} ${card.power ? `(${card.power}/${power.toughness})` : ''}`;
	const text = parseSymbols(card.text);

	return {
      type: "section",
      text: {
        type: "plain_text",
        text: `${name}\n${mana}\n${type}\n${text}`,
		emoji: true
      },
      accessory: {
        type: "image",
        image_url: card.image.replace("https://", "http://"),
        alt_text: card.name
      }
    }
}
