import fetch from 'node-fetch';
import { URLSearchParams } from 'url';

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


const get = (params) => {
	const cardPromise = fetch(`${CardAPIBase}?code=${code}&name=${params.text}`, { method: 'get' })
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

            if(res.card.price) {
            	fields.push({
                    title: "Price",
                    value: res.card.price,
                    short: true 
                })
            }

			return {
	        	title: res.card.name,
	            text: parseSymbols(res.card.text),
	            color: getCardColour(res.card),
	            "image_url": res.card.image.replace("https://", "http://"),
	            fields
	        };
	    });

		const text = attachments.length === 1 ? `result for *${params.text}*` : `no exact match for *${params.text}*, showing closest`;

		return {
			text,
	    	response_type: "in_channel",
	    	attachments
		}
	})
	.catch(err => {
		return {
			text: `No results for *${params.text}*`,
	    	response_type: "in_channel",
		}
	})

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
