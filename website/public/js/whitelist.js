const fakeAddresses = [
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve'
];

const leafNodes = fakeAddresses.map(addr => keccak256(addr).toString('hex'));
console.log('Leaf', leafNodes[0])
const merkletree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
const rootHash = merkletree.getRoot();

function getWhitelistProof() {
  const userAddr = document.getElementById('address').value;
  const hashAddr = keccak256('fwefvev');
  console.log('Input', hashAddr.toString('hex'));
  const proof = merkletree.getHexProof(hashAddr);
  console.log(proof)
  console.log(merkletree.toString());
}
