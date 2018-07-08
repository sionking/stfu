require('dotenv').config()
require('instagram-private-api')

const Client = require('instagram-private-api').V1;
const device = new Client.Device(process.env.IG_USER);
const storage = new Client.CookieFileStorage(`./cookies/${process.env.IG_USER}.json`);

// And go for login
Client.Session.create(
  device,
  storage,
  process.env.IG_USER,
  process.env.IG_PASSWORD
).then(function (session) {
  // Now you have a session, we can follow / unfollow, anything...
  // And we want to follow Instagram official profile
  return [session, Client.Account.searchForUser(session, 'instagram')]
})
  .spread(function (session, account) {
    return Client.Relationship.create(session, account.id);
  })
  .then(function (relationship) {
    console.log(relationship.params)
    // {followedBy: ... , following: ... }
    // Yey, you just followed @instagram
  })


