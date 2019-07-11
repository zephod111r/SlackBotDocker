import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { log } from '../utils';
import { BASE_URI, CODE, safeMessage } from './constants';

const CardAPIBase = `${BASE_URI}/Cards`;

const backgroundColours = {
	'U': '#66B6E0',
	'W': '#E5E2CD',
	'B': '#28241C',
	'R': '#C52C1D',
	'G': '#578162',
	'': '#CACBCF'
}
const getCardColour = card => {
	const backgroundIndex = card.manaCost ? card.manaCost.replace(/[{}Xx/P½hH]/g, '').split('').filter((l,i,a) => {
		return isNaN(+l) && !a.slice(i+1).find(test => test === l);
	}).join(':') : card.colorIdentity ? card.colorIdentity.join(':') : '';
	return backgroundColours[backgroundIndex] || '#CDBA86';
}

const symbols = {
	'{T}': ':mtg_tap:',
	'{∞}': ':mtg_infinite:',
	'{½}': ':mtg_half:',
	'{100}': ':mtg_100-1::mtg_100-2:',
	'{1000000}': ':mtg_1000000-1::mtg_1000000-2::mtg_1000000-3::mtg_1000000-4:',
}
const replaceSymbol = match => symbols[match] || `:mtg_${match.replace(/[\{\}\/]/g, '').toLowerCase()}:`
export const parseSymbols = string => string ? string.replace(/(\{.+?\})/g, replaceSymbol) : ''

export const getCard = (card, setName) => {

	if(!CODE) {
		return Promise.resolve({
			text: 'No code installed, cannot retrieve card details'
		})
	}

	return fetch(`${CardAPIBase}?code=${CODE}&name=${encodeURIComponent(card.trim())}`, { method: 'get' })
		.then(res => res.json())
		.then(data => {
			if(data.length === 0) return getNoCard(card);
			return data.length === 1 ? getSingleCard(data, setName) : getOptionsCard(data)
		})
		.catch(err => {
			log.error(err);
			return {
				title: `No results for *${card}*`,
				text: `*error*, ${safeMessage(err.message)}`,
		    	response_type: "in_channel",
			}
		})
}

const getNoCard = name => {
	return {
    	text: `No match for ${name}, try again`,
    };
};
const getOptionsCard = data => {
	return {
    	text: 'No exact match found, please choose:',
    	response_type: "ephemeral",
    	attachments: [{
    		title: "Best matches here, choose one to post:",
        	actions: [{
	    		name: 'Choose a result',
	            text: "Pick a card, any card...",
	            type: "select",
	            options: data.map(res => ({
	            	text: res.card.name,
	            	value: res.card.name
	            }))	
	    	}],
        	callback_id: 'searchMiss'
	    }]
    };
};

const getSingleCard = (data, setName) => {
	const res = data[0];

	const fields = [
		{
			title: "Gatherer link",
			value: `<http://gatherer.wizards.com/Pages/Card/Details.aspx?name=${encodeURIComponent(res.card.name)}|${res.card.name}>`
		},
        {
            title: "Mana cost",
            value: `\u2063${parseSymbols(res.card.manaCost)}`,
            short: true 
        }
    ];

    const setInd = setName ? res.card.sets.findIndex(set => set.setname === setName) : res.card.sets.findIndex(set => set.settype !== 'promo') || 0;
    const set = res.card.sets[setInd];

    if(set.price) {
    	fields.push({
            title: "Price",
            value: set.price,
            short: true 
        })
    }
	fields.push({
        title: "Set",
        value: `*${res.card.sets[setInd].setname}*`,
        short: true
    })

    let actions = null;

    if(res.card.sets.length > 1) {
    	actions = [
        	{
        		name: res.card.name,
                text: "Pick another set...",
                type: "select",
                options: res.card.sets.map((set, ind) => ({text:set.setname, value:set.setname}))
        	}
        ]
    }

	return {
		text: `Match for ${res.card.name}`,
    	response_type: "in_channel",
    	attachments: [{
	    	title: res.card.name,
	        text: parseSymbols(res.card.text),
	        color: getCardColour(res.card),
	        image_url: set.image ? set.image : '',
	        fields,
	        actions,
	        callback_id: 'cardSet'
	    }]
	}
};