require('dotenv').config()
require('instagram-private-api')

_ = require('lodash')


const Client = require('instagram-private-api').V1;
const device = new Client.Device(process.env.IG_USER);
const storage = new Client.CookieFileStorage(`./cookies/${process.env.IG_USER}.json`);

Client.Session.create(
    device,
    storage,
    process.env.IG_USER,
    process.env.IG_PASSWORD
  )
  .then(async session => {
    let accountId = await session.getAccountId()
    let feeds = await new Client.Feed.AccountFollowing(session, accountId, 400);
    feeds.get()
      .then(res => {

        let kue = require('kue')
          , queue = kue.createQueue();

        const followings = res.map(account => account._params.id)

        for (id of followings) {
          Client.Account.muteStory(session, id)
        }

      })
  })

// Get a list of all my followings

// Loop through each

// Create a request to mute them

// If this account is in my `whiteList` array, I'll unmute() them (in case they were previously muted)

// Otherwise, we call account.mute()

// .then() we hand off the request to our queueing module, so we don't get rate-limit banned by instagram


