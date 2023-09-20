pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import { MerkleProof } from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract PetrolHeadsTEST is ERC721Enumerable, Ownable {
  using Strings for uint256;
  using SafeMath for uint256;

  enum Phase {
    Presale,
    Public
  }

  string public baseURI;
  string public baseExtension = ".json";

  // Pre-sale
  uint256 public presaleCost = 120000000000000000; //0.12 ETH
  uint256 public presaleLimit = 2;
  string public notRevealedURI;

  // Public sale
  uint256 public cost = 150000000000000000; // 0.15 ETH
  uint256 public maxSupply = 10000;
  uint256 public maxMintAmount = 5;
  uint256 public reserveAmount = 100;

  bool public paused = false;
  bool public revealed = false;
  bool public locked = false;
  bool internal reserved = false;

  bytes32 public whitelistRoot;

  Phase public phase;

  event PhaseTriggered(
    Phase indexed phase,
    uint256 indexed mintCost,
    uint256 indexed mintLimit
  );

  constructor(
    string memory _name,
    string memory _symbol,
    string memory _initBaseURI
  ) ERC721(_name, _symbol) {
    setBaseURI(_initBaseURI);
  }

  // internal
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  function walletLimitNotExceeded(address _user, uint256 _amount, uint256 _maxAmount) internal view returns (bool) {
    require(balanceOf(_user).add(_amount) <= _maxAmount, "ERROR: Max NFT per address reached.");
    return true;
  }

  function isAuthorised(address _whitelistAddress, bytes32[] calldata _whitelistProof) internal view returns (bool) {
    bytes32 leaf = keccak256(abi.encodePacked(_whitelistAddress));
    require(MerkleProof.verify(_whitelistProof, whitelistRoot, leaf), "User is not whitelisted.");
    return true;
  }

  // public
  function mint(address _to, uint256 _mintAmount, bytes32[] calldata _whitelistProof) public payable {
    uint256 supply = totalSupply();
    require(!paused, "ERROR: Minting is currently paused.");
    require(_mintAmount > 0, "ERROR: Mint amount must be greater than 0.");
    require(supply + _mintAmount <= maxSupply, "ERROR: There are not enough available for this amount.");
    require(_to != address(0), "ERROR: Address cannot be 0");

    if (msg.sender != owner()) {
      if (phase == Phase.Presale) {

        isAuthorised(_to, _whitelistProof);
        require(_mintAmount <= presaleLimit, "ERROR: You cannot mint this many Petrol Heads.");
        require(presaleCost.mul(_mintAmount) <= msg.value, "ERROR: Ether value sent is not correct.");
        walletLimitNotExceeded(_to, _mintAmount, presaleLimit);

      } else {

        require(_mintAmount <= maxMintAmount, "ERROR: You cannot mint this many Petrol Heads.");
        require(cost.mul(_mintAmount) <= msg.value, "ERROR: Ether value sent is not correct.");
        walletLimitNotExceeded(_to, _mintAmount, maxMintAmount);

      }
    }

    for (uint256 i = 1; i <= _mintAmount; i++) {
      _safeMint(_to, supply + i);
    }
  }

  function walletOfOwner(address _owner)
    public
    view
    returns (uint256[] memory)
  {
    uint256 ownerTokenCount = balanceOf(_owner);
    uint256[] memory tokenIds = new uint256[](ownerTokenCount);
    for (uint256 i; i < ownerTokenCount; i++) {
      tokenIds[i] = tokenOfOwnerByIndex(_owner, i);
    }
    return tokenIds;
  }

  function tokenURI(uint256 tokenId)
    public
    view
    virtual
    override
    returns (string memory)
  {
    require(
      _exists(tokenId),
      "ERC721Metadata: URI query for nonexistent token"
    );

    string memory currentBaseURI = _baseURI();
    return bytes(currentBaseURI).length > 0
        ? string(abi.encodePacked(currentBaseURI, tokenId.toString(), baseExtension))
        : "";
  }

  //only owner
  function setCost(uint256 _newCost) public onlyOwner {
    require(_newCost > 0, "ERROR: Mint cost cannot be 0 or lower.");
    cost = _newCost;
  }

  function reserveRacers() public onlyOwner {
    uint supply = totalSupply();
    uint i;

    require(reserved == false);
    require(supply + reserveAmount <= maxSupply);

    for (i = 0; i < reserveAmount; i++) {
      _safeMint(msg.sender, supply + i);
    }

    reserved = true;
  }

  function setPhase(Phase _phase) public onlyOwner {
    require(_phase != phase, "ERROR: This phase is already active.");

    phase = _phase;
    emit PhaseTriggered(_phase, cost, maxMintAmount);
  }

  function setMaxMintAmount(uint256 _newmaxMintAmount) public onlyOwner {
    maxMintAmount = _newmaxMintAmount;
  }

  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    require(locked == false);
    baseURI = _newBaseURI;
  }

  function setBaseExtension(string memory _newBaseExtension) public onlyOwner {
    require(locked == false);
    baseExtension = _newBaseExtension;
  }

  function pause(bool _state) public onlyOwner {
    paused = _state;
  }

  function setWhitelistRoot(bytes32 _root) public onlyOwner {
    whitelistRoot = _root;
  }

  function withdraw() public payable onlyOwner {
    require(payable(msg.sender).send(address(this).balance));
  }

  function lockMetadata() public onlyOwner {
    require(revealed == true);
    locked = true;
  }
}
