require('dotenv').config();
require('instagram-private-api');

_ = require('lodash');

const Client = require('instagram-private-api').V1;
const device = new Client.Device(process.env.IG_USER);
const storage = new Client.CookieFileStorage(`./cookies/${process.env.IG_USER}.json`);

const getSession = async () => {
  return Client.Session.create(
    device,
    storage,
    process.env.IG_USER,
    process.env.IG_PASSWORD
  );
};

const init = async () => {

  // Login
  const session = await getSession();

  // Get my account info
  const myAccount = await session.getAccount();

  // Part 1/2) Use my login and account info to get my followers
  // Part 2/2) Call .get() on the feed object to
  const followings = await (await new Client.Feed.AccountFollowing(session, myAccount.id)).get();

  // Setup the queue
  const queue = require('kue').createQueue();
  queue.watchStuckJobs(1000);
  const delay_in_ms = process.env.DELAY_SECONDS * 1000;
  queue.on('ready', () => console.info('Queue is ready!'));

  // Loop through the followings and get
  let jobs = [];

  for (let account of followings.slice(0, process.env.MAX_MUTES)) {

    let job = queue.create('mute', account).save();

    job.on('complete', result => {
      console.log('Job completed with data ', result);
    }).on('failed attempt', (errorMessage, doneAttempts) => {
      console.log('Job failed');
    }).on('failed', errorMessage => {
      console.log('Job failed');
    }).on('start', job => {
      console.log(job);
    }).on('job enqueue', (id, type) => {
      console.log('Job %s got queued of type %s', id, type)``
    });

    jobs.push(job)

  }

  for (job in jobs) {
    console.log(`Processing ${job.data._params.username}`);
  }
  queue.process('mute', 1, (job, account) => {
  });

  // setTimeout(, process.env.DELAY_SECONDS * 1000)

};