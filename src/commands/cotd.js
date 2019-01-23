const generate = () => {
	return Promise.resolve({
    	text: "New COTD",
    	response_type: "in_channel"
	})
}
const guess = (params) => {
	return Promise.resolve({
    	text: `${params.text}: Incorrect, sucker!`,
    	response_type: "in_channel"
	});
}
const score = () => {
	return Promise.resolve({
    	text: "Andrew is winning",
    	response_type: "in_channel"
	});
}
const show = () => {
	return Promise.resolve({
   		text: "The back of a card",
   		response_type: "in_channel"
	});
}

const cotdMap = {
	'new': props => generate(props),
	'score': props => score(props),
	'show': props => show(props),
	'default': props => guess(props)
}


const handleCommand = ({text, user_id}) => {
	const trimmed = text.trim();
	return (cotdMap[trimmed] ? cotdMap[trimmed] : cotdMap['default'])({text, user_id})
}

export {
	handleCommand
};
