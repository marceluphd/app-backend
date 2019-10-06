const router = require('express').Router();
const pubSubHubbub = require('pubsubhubbub');
const { parseString } = require('xml2js');

const { YOUTUBE_CHANNEL_ID, NODE_ENV, YOUTUBE_WEBHOOK_SECRET } = require('../config');
const { fetchVideosJob } = require('../helpers/fetchData');

const deployURL = NODE_ENV === 'production' ? 'api' : 'api-dev';
const callbackUrl = `https://${deployURL}.codinggarden.community/youtube-webhook`;

let lastestVideoID;

const pubsub = pubSubHubbub.createServer({
  callbackUrl,
  secret: YOUTUBE_WEBHOOK_SECRET,
});

pubsub.on('feed', data => {
  const xml = data.feed.toString();

  parseString(xml, (err, result) => {
    if (err) return;

    const { entry } = result.feed;

    if (entry && entry.length !== 0) {
      const { 'yt:channelId': channelID, 'yt:videoId': videoID } = entry[0];
      if (YOUTUBE_CHANNEL_ID === channelID[0] && lastestVideoID !== videoID[0]) {
        [lastestVideoID] = videoID;
        fetchVideosJob();
      }
    }
  });
});

router.use('/', pubsub.listener());
module.exports = router;