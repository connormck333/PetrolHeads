const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  address_hash: String,
  proof: Array
});

module.exports = mongoose.model('whitelisted_users', schema);
