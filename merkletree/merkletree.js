const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const mongoose = require('mongoose');
const Whitelist = require('./model_users');
const Tree = require('./model_tree');

mongoose.connect('mongodb+srv://connormck333:IAteABat2020@cluster0.i5kvz.mongodb.net/whitelist?retryWrites=true&w=majority').then(async () => {

  const addresses = await Whitelist.find({}, {address_hash: 1, proof: 1, _id: 1});
  console.log(addresses);

  const whitelisted_hashes = addresses.map((item, index) => keccak256(item.address_hash).toString('hex'));
  console.log(whitelisted_hashes);

  const merkletree = new MerkleTree(whitelisted_hashes, keccak256, { sortPairs: true });
  console.log(merkletree.toString());

  addresses.map((item, index) => {
    const proof = merkletree.getHexProof(keccak256(item.address_hash).toString('hex'));
    item.proof = proof;
    item.save();
  });

  console.log(addresses)
  console.log('ROOT:', merkletree.getRoot().toString('hex'));

  // addresses.save((err, res) => {
  //   if (!err) {
  //     console.log('successfully saved to DB');
  //   } else {
  //     console.log('ERROR:', err);
  //   }
  // })
});
