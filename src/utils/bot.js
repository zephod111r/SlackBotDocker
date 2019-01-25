import fetch from 'node-fetch';
const CardAPIBase = "https://mtgbotapi.azurewebsites.net/api/Cards";
const code = process.env.SLACK_BOT_TOKEN;

export const postMessage = (data) => fetch(`https://slack.com/api/chat.postMessage`, { 
	method: 'post', 
	headers: {
		'Content-Type':'application/json',
		Authorization: `Bearer ${code}`
	},
	body: JSON.stringify(data)
})