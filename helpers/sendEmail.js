const sgMail = require("@sendgrid/mail");
require("dotenv/config");

const { SENDGRID_API_KEY } = process.env;
sgMail.setApiKey(SENDGRID_API_KEY);

const sendEmail = (data) => {
  sgMail
    .send(data)
    .then((response) => {
      console.log(response[0].statusCode, "We sent the email. Check it.");
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = sendEmail;
