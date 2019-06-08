export const BASE_URI = 'https://mtgbotapi.azurewebsites.net/api';
export const CODE = process.env.API_CONNECTION;
export const safeMessage = (message='') => message.replace(CODE, 'CODE').replace(BASE_URI, '')