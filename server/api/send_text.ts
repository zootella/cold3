export default defineEventHandler((event) => {

//first conversation
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
//second conversation
/*
async function sendSmsWithTwilio(to, from, body) {
  const accountSid = 'your_twilio_account_sid'; // Securely store and access your SID
  const authToken = 'your_twilio_auth_token'; // Securely store and access your Auth Token
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

  const data = new URLSearchParams();
  data.append('To', to);
  data.append('From', from);
  data.append('Body', body);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(accountSid + ':' + authToken),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data,
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`Failed to send SMS: ${errorMessage}`);
  }

  return await response.json(); // or handle the response as needed
}

// Example usage:
sendSmsWithTwilio(
  '+1234567890', // To number
  '+0987654321', // From number (Twilio number)
  'Hello from serverless!'
).then(() => {
  console.log('SMS sent successfully!');
}).catch(error => {
  console.error('Error sending SMS:', error);
});
*/

	return {
		message: "hello, function send text"
	}
});
