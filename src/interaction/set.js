const handleEvent = ({actions}) => {
	const set = actions.selected_options[0].value

	getCard(card, set).then(data => {

		const fullData = Object.assign({}, data, {
			replace_original: true
		});

		fetch(params.response_url, {
			method: "POST",
			headers: {
				"Content-type": "application/json"
			},
			body: JSON.stringify(fullData)
		})
	})

	return Promise.resolve({})
}

export {
	handleEvent
};
