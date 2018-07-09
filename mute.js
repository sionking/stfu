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
).then(session => {
  return [session, Client.Account.searchForUser(session, process.env.IG_TEST_USER)]

}).spread((session, account) => {
  // Mute the user
  return Client.Relationship.mutePosts(session, account.id)

}).then(relationship => {
    console.log(relationship)
    // {followedBy: ... , following: ... }
    // Yey, you just followed @instagram
  })



//
//
// Client.Feed.AccountFollowing(
//   session,
//   accountId
// ).spread((session, feed) => {
//    // .all returns promise
//   return feed.all()
// }).then(followings => {
//     // return Client.Relationship.create(session, account.id);
//     console.log(followings)
//   })

// Get a list of all my followings

// Loop through each

// Create a request to mute them

// If this account is in my `whiteList` array, I'll unmute() them (in case they were previously muted)

// Otherwise, we call account.mute()

// .then() we hand off the request to our queueing module, so we don't get rate-limit banned by instagram


