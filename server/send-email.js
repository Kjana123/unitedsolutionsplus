const nodemailer = require('nodemailer');

exports.handler = async (event, context) => {
  const data = JSON.parse(event.body);

  const { name, email, phone, company, service, message } = data;

  const transporter = nodemailer.createTransport({
    host: 'smtpout.emailsrvr.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"United Solutions Plus" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    subject: `New Contact from ${name}`,
    html: `
      <h2>Contact Form Submission</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Company:</strong> ${company}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Message:</strong><br>${message}</p>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: 'Email sent successfully' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: error.message })
    };
  }
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtpout.emailsrvr.com',
    port: 465,
    secure: true,
    auth: {
        user: 'info@unitedsolutionsplus.in',
        pass: 'info@1234'
    }
});

