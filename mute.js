require('dotenv').config();
require('instagram-private-api');
// FUNCTIONS
const delay_in_ms = process.env.DELAY_SECONDS * 1000;

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
  console.log(`SUCCESS: muted ${job.data.username}!`)
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

          Client.Relationship.mutePosts(session, job.data.id);
          Client.Relationship.muteStory(session, job.data.id);

          setTimeout(done, delay_in_ms)
        })
    })
  })
};

muteAllUsers();

