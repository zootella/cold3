export default defineEventHandler((event) => {

/*
	const url = 'https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json';
	const username = 'YOUR_ACCOUNT_SID'; // Your Twilio Account SID
	const password = 'YOUR_AUTH_TOKEN'; // Your Twilio Auth Token

	const body = new URLSearchParams({
		To: '+1234567890', // Recipient phone number
		From: '+10987654321', // Your Twilio phone number
		Body: 'Your authentication code: 123456', // Your message body
	});

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': 'Basic ' + btoa(username + ":" + password),
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: body,
	});
*/

	return {
		message: "hello, function send text"
	}
});
