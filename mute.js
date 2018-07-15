require('dotenv').config();
require('instagram-private-api');
// FUNCTIONS
const delay_in_ms = process.env.DELAY_SECONDS * 1000;
const whitelist = process.env.WHITELIST.split(' ');

const Client = require('instagram-private-api').V1;
const device = new Client.Device(process.env.IG_USER);
const storage = new Client.CookieFileStorage(`./cookies/${process.env.IG_USER}.json`);

// *** QUEUE ***

const Queue = require('bee-queue');
const queue = new Queue('mute');
queue.destroy().then(() => console.log('Queue destroyed!'));

queue.on('ready', () => console.log('Ready!'));
queue.on('error', (err) => {
  console.log(`A queue error happened: ${err.message}`);
});
queue.on('failed', (job, err) => {
  console.log(`FAILED: Mute ${job.data.username}: ${err.message}`);
});
queue.on('succeeded', job => {
  console.log(`SUCCESS: Processed ${job.data.username}!`)
});

const muteAllUsers = async () => {

  const session = await new Client.Session
    .create(
      device,
      storage,
      process.env.IG_USER,
      process.env.IG_PASSWORD
    );

  session.getAccountId().then(id => {

    let feed = new Client.Feed.AccountFollowing(session, id);

    feed.get().then(followings => {

      for (let f of followings
        .reverse()
        .slice(0, process.env.MAX_MUTES)
        ) {

        console.log(`Creating a job for ${f._params.username}.`);

        queue.createJob({
          username: f._params.username,
          id: f._params.id
        })
          .save()
          .then(job => {
            console.log(`Saved job ${job.id} for ${job.data.username}`)
          })

      }

      queue
        .process(1, (job, done) => {
          console.log(`Started job ${job.id} for ${job.data.username}.`);

          Client.Relationship.get(session, job.data.id).then(rel => {

            if (whitelist.includes(job.data.username)) {

              if (!rel.params.muting && !rel.params.is_muting_reel) {
                console.log(`WHITELIST: ${job.data.username} is already whitelisted.`);
                done();
                return;
              }

              if (rel.params.muting) {
                console.log(`WHITELIST: unmutePosts() for ${job.data.username}.`);
                Client.Relationship.unmutePosts(session, job.data.id);
              }
              if (rel.params.is_muting_reel) {
                console.log(`WHITELIST: unmuteStory() for ${job.data.username}.`);
                Client.Relationship.unmuteStory(session, job.data.id);
              }

            } else {

              // Check if the user is already muted
              if (rel.params.muting && rel.params.is_muting_reel) {
                console.log(`SKIP: ${job.data.username} is already muted both.`);
                done();
                return
              }
              if (!rel.params.muting) {
                console.log(`Executing mutePosts() for ${job.data.username}.`);
                Client.Relationship.mutePosts(session, job.data.id);
              }
              if (!rel.params.is_muting_reel) {
                console.log(`Executing muteStory() for ${job.data.username}.`);
                Client.Relationship.muteStory(session, job.data.id);
              }
              console.log(`*** Sleeping for ${process.env.DELAY_SECONDS} seconds.`)
            }

            // Sleep so we don't get rate limited
            setTimeout(done, delay_in_ms)
          })

        })
    })
  });
};

muteAllUsers();

