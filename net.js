const request         = require('request'),
      CONFIG          = require('./config'),
      Utils           = require('./utils'),
      RequestProgress = require('request-progress'),
      fs              = require('fs');

module.exports = {
  /**
   * Returns array of episodes URL
   * @param {string} anime_id anime id
   * @return {string[]} array of episodes url
   */
  getSources(anime_id) {
    return new Promise((resolve, reject) => {
      request.get(`https://twist.moe/api/anime/${anime_id}/sources`, {
        headers: {'x-access-token': CONFIG.ACCESS_TOKEN},
        json: true
      }, (err, resp, json) => {
        if (err || resp.statusCode !== 200)
          return reject(err || resp.statusCode + ' ' + resp.statusMessage);

        resolve(json.map(ep => Utils.decryptURL(ep.source)));
      });
    });
  },
  /**
   * 
   * @param {string} url file url
   * @param {string} folderPath folder path
   * @param {{ percent: Number, speed: Number, eta: Number, current:Number, total: Number }} onProgress on progress callback (speed in bytes / eta in seconds)
   */
  downloadFile(url, folderPath, onProgress) {

    const fileName = url.substring(url.lastIndexOf('/') + 1);

    return new Promise((resolve, reject) => {
      RequestProgress(
        request(url)
      )
        .on('progress', state => onProgress({
          percent: Math.round(state.percent * 100),
          speed: Math.round(state.speed / 1000),
          eta: Math.round(state.time.remaining),
          total: Math.round(state.size.total / 1000),
          current: Math.round(state.size.transferred / 1000)
        }))
        .on('error', reject)
        .on('end', resolve)
        .pipe(fs.createWriteStream(`${folderPath}/${fileName}`))
    });
  }
}
