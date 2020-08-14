const dotenv = require("dotenv").config();

module.exports = {
  slackSigningSecret: process.env.SLACK_SIGNING_SECRET,
  slackBotToken: process.env.SLACK_BOT_TOKEN,
  port: process.env.PORT || 3000,
};
