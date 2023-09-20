const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  tree: String
});

module.exports = mongoose.model('whitelisted_tree', schema);
