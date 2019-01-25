const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');

const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(redisUrl);
//to avoid using callbacks in client.get we promisify client.get
client.get = util.promisify(client.get);

// store the reference of the original exec function
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function() {
  // set a flag to cahce the results
  this.useCache = true;

  // make this function chainable
  return this;
}

// must use function() {} bc of 'this'
mongoose.Query.prototype.exec = async function() {
  if(!this.useCache) {
    return exec.apply(this, arguments);
  }

  // do not modify the result of getQuery because it may modify the results, so prepare a new object for the cahce key
  const key = JSON.stringify({...this.getQuery(), collection: this.mongooseCollection.name});

  // see if we have any a value for 'key' in redis
  const cacheValue = await client.get(key);

  // if we do, return that
  if (cacheValue) {
    // cacheValue is a JSON but the app expexts a Mongoose Model, so we need to hydrate model
    // but the problem is the new model is an array
    //const doc = new this.model(JSON.parse(cacheValue));

    const doc = JSON.parse(cacheValue);

    return Array.isArray(doc)
      ? doc.map(d => new this.model(d))
      : new this.model(doc);
  }

  // otherwise, issue the query and store the result in redis
  // exec returns a mongoose document
  const result = await exec.apply(this, arguments);

  client.set(key, JSON.stringify(result));

  return result;

}