require('dotenv').config();
const sendEmail = require('./backend/utils/sendEmail');

sendEmail(
  process.env.EMAIL_USER,
  'Test Email from Hairstylist App',
  'This is a test email.'
).then(() => {
  console.log('Test email sent!');
  process.exit(0);
}).catch(err => {
  console.error('Failed to send test email:', err);
  process.exit(1);
}); 