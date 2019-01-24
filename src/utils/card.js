import fetch from 'node-fetch';
import { URLSearchParams } from 'url';
import { log } from '../utils';

const CardAPIBase = "https://mtgbotapi.azurewebsites.net/api/Cards";
const code = process.env.API_CONNECTION;

const backgroundColours = {
	'U': '#66B6E0',
	'W': '#E5E2CD',
	'B': '#28241C',
	'R': '#C52C1D',
	'G': '#578162',
	'': '#CACBCF'
}
const getCardColour = card => {
	const backgroundIndex = card.manaCost ? card.manaCost.replace(/[{}Xx/P]/g, '').split('').filter((l,i,a) => {
		return isNaN(+l) && !a.slice(i+1).find(test => test === l);
	}).join(':') : card.colorIdentity ? card.colorIdentity.join(':') : '';
	return backgroundColours[backgroundIndex] || '#CDBA86';
}

const symbols = {
	'{T}': ':mtg_tap:',
	'{∞}': ':mtg_infinite:',
}
const replaceSymbol = match => symbols[match] || `:mtg_${match.replace(/[\{\}\/]/g, '').toLowerCase()}:`
const parseSymbols = string => string.replace(/(\{.+?\})/g, replaceSymbol)

export const getCard = (card, setName) => fetch(`${CardAPIBase}?code=${code}&name=${card}`, { method: 'get' })
	.then(res => res.json())
	.then(data => {
		const attachments = data.slice(0, 3).map(res => {
			const fields = [
				{
					title: "Gatherer link",
					value: `*<http://gatherer.wizards.com/Pages/Card/Details.aspx?name=${encodeURIComponent(res.card.name)}|${res.card.name}>*`
				},
                {
                    title: "Mana cost",
                    value: `\u2063${parseSymbols(res.card.manaCost)}`,
                    short: true 
                }
            ];

            const setInd = setName ? res.card.sets.findIndex(set => set.setname === setName) : 0;
            const set = res.card.sets[setInd];

            console.log(setInd, set)

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

            console.log(actions)

			return {
	        	title: res.card.name,
	            text: parseSymbols(res.card.text),
	            color: getCardColour(res.card),
	            image_url: set.image.replace("https://", "http://"),
	            fields,
	            actions,
	            callback_id: 'cardSet'
	        };
	    });

		const text = attachments.length === 1 ? `result for *${card}*` : `no exact match for *${card}*, showing closest`;

		return {
			text,
	    	response_type: "in_channel",
	    	attachments
		}
	})
	.catch(err => {
		log.error(err);
		return {
			text: `No results for *${card}*`,
	    	response_type: "in_channel",
		}
	})
