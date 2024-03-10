import nodemailer from "nodemailer";

const sendMail = async (to, subject, message) => {
  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use `true` for TLS if your Gmail account requires it
    auth: {
      user: "ux.mohib@gmail.com", // Your email address
      pass: "ywoi hptj dfud ujdu", // Your email password or app password if using Gmail
    },
  });

  // Email message options
  let mailOptions = {
    from: "ux.mohib@gmail.com", // Sender email address
    to: to, // List of recipients
    subject: subject, // Subject line
    text: message, // Plain text body
    // html: message, // HTML body
  };

  // Send email
  await transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log("Error occurred:", error);
    } else {
      console.log("Email sent successfully:", info.response);
    }
  });
};
export default sendMail;
