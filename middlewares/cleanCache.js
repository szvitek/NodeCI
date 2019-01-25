const { clearHash } = require('../services/cache');

module.exports = async (req,res,next) => {
  //trick to use this middleware to call the route handler then it comes back and continue executing this file
  await next();

  clearHash(req.user.id);
}