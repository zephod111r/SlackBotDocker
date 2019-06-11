import request from 'request';
import mergeImg from 'merge-img';

const makeUrl = (id, ind) => ({ src: `http://data.mtgbot.co.uk/minature/${id}.jpeg`, offsetX: ind === 0 ? 0 : 10 });

export const getImageFrom = imageArr => {
	return mergeImg(imageArr.map(makeUrl), { margin:10, color: 0xFFFFFFFF });
}
