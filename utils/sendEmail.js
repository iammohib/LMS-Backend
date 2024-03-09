import nodemailer from "nodemailer";

const sendMail = async (to, subject, message) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  await transporter.sendMail({
    from: '" 👻" <terabaap@ethereal.email>', // sender address
    to: to, // list of receivers
    subject: subject, // Subject line
    text: message, // plain text body
    html: `${message}`, // html body
  });
};

export default sendMail;
