
import { log, see, look } from '../../library/library0.js'

export default defineEventHandler(async (event) => {

//first conversation
/*
	const url = 'https://api.sendgrid.com/v3/mail/send';
	const apiKey = 'YOUR_SENDGRID_API_KEY'; // Your SendGrid API Key

	const body = JSON.stringify({
		personalizations: [{ to: [{ email: 'user@example.com' }] }],
		from: { email: 'your-email@example.com' }, // Your verified sender email
		subject: 'Your Authentication Code',
		content: [{ type: 'text/plain', value: 'Your authentication code: 123456' }],
	});

	const response = await fetch(url, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: body,
	});
*/
//second conversation
/*
async function sendEmailWithSendGrid(to, from, subject, htmlContent) {
  const apiKey = 'your_sendgrid_api_key_here'; // Securely store and access your API key
  const url = 'https://api.sendgrid.com/v3/mail/send';

  const data = {
    personalizations: [{ to: [{ email: to }] }],
    from: { email: from },
    subject: subject,
    content: [{ type: 'text/html', value: htmlContent }],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorMessage = await response.text();
    throw new Error(`Failed to send email: ${errorMessage}`);
  }

  return await response.json(); // or handle the response as needed
}

// Example usage:
sendEmailWithSendGrid(
  'recipient@example.com',
  'sender@example.com',
  'Test Subject',
  '<p>This is the email content</p>'
).then(() => {
  console.log('Email sent successfully!');
}).catch(error => {
  console.error('Error sending email:', error);
});
*/



	try {
		// Assuming the content type is JSON
		const body = await readBody(event)
		look(readBody, event, body)


		/*
		put it in log
		if log has multiple arguments, it puts each on a line
		if an argument is an object, it spells it out name, type, value
		*/

/*
		// Example logic: Echo back the received name with a message
		const name = body.name;

		// You can perform database operations or other logic here

		return { message: `Hello, ${name}! Your form was submitted successfully.` };
	} catch (error) {
		// Handle potential errors
		return createError({
			statusCode: 400,
			statusMessage: 'Bad Request',
			data: { message: 'Error processing the form submission.' },
		});
	}
});
*/
	} catch (e) {
		log('error', see(e))
	
	}


	return {
		message: "hello, function send email"
	}
});
