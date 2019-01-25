const mongoose = require('mongoose');

// store the reference of the original exec function
const exec = mongoose.Query.prototype.exec;

// must use function() {} bc of 'this'
mongoose.Query.prototype.exec = function() {
  console.log('run a query');

  return exec.apply(this, arguments);
}