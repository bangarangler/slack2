// require("dotenv").config();
const { port, slackSigningSecret, slackBotToken } = require("./config");
const { createServer } = require("http");
const express = require("express");
const bodyParser = require("body-parser");
const { createEventAdapter } = require("@slack/events-api");
const { WebClient } = require("@slack/web-api");
const { createMessageAdapter } = require("@slack/interactive-messages");
const { v4: uuidv4 } = require("uuid");
const cors = require("cors");

// const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
// const port = process.env.PORT || 3000;

const slackEvents = createEventAdapter(slackSigningSecret);
const webClient = new WebClient(slackBotToken);
const slackInteractions = createMessageAdapter(slackSigningSecret);

const app = express();

app.use(cors());
app.use("/", slackEvents.requestListener());
app.use("/slack/events", slackEvents.expressMiddleware());
app.use("/slack/actions", slackInteractions.expressMiddleware());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  // Set CORS headers so that the React SPA is able to communicate with this server
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Authorization", `Bearer ${slackBotToken}`);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type",
    "application/json"
  );
  next();
});

const wantAModal = {
  blocks: [
    {
      type: "section",
      text: {
        type: "plain_text",
        text: "Hey, what do you want?",
        emoji: true,
      },
    },
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Hey, what do you want? Need a modal?",
      },
      accessory: {
        type: "button",
        text: {
          type: "plain_text",
          text: "Launch",
          emoji: true,
        },
        value: "click_me_1238393939939393",
        action_id: "open_modal",
      },
    },
  ],
};

const giveAModal = {
  type: "modal",
  callback_id: "beast_modal_submit",
  title: {
    type: "plain_text",
    text: "My App",
    emoji: true,
  },
  submit: {
    type: "plain_text",
    text: "Choose",
    emoji: true,
  },
  close: {
    type: "plain_text",
    text: "Cancel",
    emoji: true,
  },
  blocks: [
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "Pick Beast!",
      },
      accessory: {
        type: "static_select",
        action_id: "beast_name_el",
        placeholder: {
          type: "plain_text",
          text: "Select a Beast",
          emoji: true,
        },
        options: [
          {
            text: {
              type: "plain_text",
              text: "Unicorn",
              emoji: true,
            },
            value: "unicorn",
          },
          {
            text: {
              type: "plain_text",
              text: "Hydra",
              emoji: true,
            },
            value: "hydra",
          },
          {
            text: {
              type: "plain_text",
              text: "Dragon",
              emoji: true,
            },
            value: "dragon",
          },
        ],
      },
    },
    {
      type: "input",
      block_id: "beast_name_block",
      element: {
        type: "plain_text_input",
        action_id: "beast_name_el",
      },
      label: {
        type: "plain_text",
        text: "Name your beast",
        emoji: true,
      },
    },
  ],
};

// Slack Events
slackEvents.on("app_mention", async (event) => {
  try {
    console.log("I got a mention in this channel", event.channel);
    const wantAModalRes = { ...wantAModal, ...{ channel: event.channel } };
    const res = await webClient.chat.postMessage(wantAModalRes);
    console.log("Message sent :>> ", res.ts);
  } catch (e) {
    console.log("e :>> ", e);
  }
});

slackEvents.on("error", (error) => {
  console.log("error :>> ", error);
  console.log("error.name :>> ", error.name);
});

// Slack Interactions
slackInteractions.action(
  {
    actionId: "open_modal",
  },
  async (payload) => {
    console.log("actionId", actionId);
    try {
      console.log("button click recieved", payload);
      await webClient.views.open({
        trigger_id: payload.trigger_id,
        view: giveAModal,
      });
    } catch (err) {
      console.log("err :>> ", err);
    }
    // return res.status(200).json({
    //   text: "Processing...",
    // });
    return {
      text: "Processing...",
    };
  }
);

// slackEvents.on("url_verification", (event) => {
//   console.log("event :>> ", event);
//   return res.status(200).json({ challenge: process.env.SLACK_SIGNING_SECRET });
// });

const server = createServer(app);

server.listen(port, () => {
  console.log(`Bot is listening on ${server.address().port}`);
});
