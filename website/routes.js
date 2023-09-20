const express = require("express");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256')
const Whitelist = require("./models/user");
const router = express.Router();

router.get("/checkwl", async (req, res) => {

  const fetched_proof = await Whitelist.findOne({address_hash: req.query.id});

  console.log(req.query.id)
  console.log(fetched_proof);

  if (!fetched_proof) {
    return res.status(401).send("ERROR: User is not whitelisted.");
  }

  res.status(200).send(JSON.stringify({proof: fetched_proof.proof}));
});

module.exports = router;
