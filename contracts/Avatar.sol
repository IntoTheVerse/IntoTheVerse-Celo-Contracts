// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";

contract Avatar is Ownable, ERC721Enumerable {

    using Strings for uint256;

    // baseURI is default avatar image
    string public _baseTokenURI;

    struct AvatarInfo {
        uint256 tokenId;
        string image; // Assuming the image is a string URI, you can modify this based on your requirements
        uint256 xp;
        bool isParticipatingInRef;
        address ownerAddress; // Add owner address to AvatarInfo
    }

    // Mapping to store equipment for each tokenId
    mapping(uint256 => uint256[]) public equipments;

    // Mapping to store badges for each tokenId
    mapping(uint256 => uint256[]) public badges;

    // Mapping to store information about each avatar
    mapping(uint256 => AvatarInfo) public avatars;

    mapping(address => bool) public _hasMintedAvatar; // Mapping to track whether an address has already

    constructor(string memory baseURI) Ownable(msg.sender) ERC721("AVATAR", "ITVA") {
        setBaseURI(baseURI);
    }

    /**
     * @dev _baseURI overrides the Openzeppelin's ERC721 implementation which by default
     * returned an empty string for the baseURI
     */
    function getDefaultImage() public view returns (string memory) {
        return _baseTokenURI;
    }

    /**
     * @dev setBaseURI
     * @param _uri base url for metadata
     */
    function setBaseURI(string memory _uri) public onlyOwner {
        _baseTokenURI = _uri;
    }

    function mint(string memory image) external {
        require(!_hasMintedAvatar[msg.sender], "You already have an avatar");
        // Mint new Avatar NFT to the owner
        uint256 tokenId = totalSupply() + 1;
        _safeMint(msg.sender, tokenId);

        // Store information about the avatar
        avatars[tokenId] = AvatarInfo(tokenId, image, 0, false, msg.sender);
    }

    function changeAvatarImage(uint256 tokenId, string memory newImage) external {
        // Ensure the caller is the owner of the avatar
        require(msg.sender == avatars[tokenId].ownerAddress, "Not the owner");

        // Change the avatar image
        avatars[tokenId].image = newImage;
    }

    function getXP(uint256 tokenId) external view returns (uint256) {
        return avatars[tokenId].xp;
    }

    function incrementXP(uint256 tokenId, uint256 amount) external onlyOwner {
        avatars[tokenId].xp += amount;
    }

    function decrementXP(uint256 tokenId, uint256 amount) external onlyOwner {
        require(avatars[tokenId].xp >= amount, "XP cannot be negative");
        avatars[tokenId].xp -= amount;
    }

    function participateInRef(uint256 tokenId) external onlyOwner {
        avatars[tokenId].isParticipatingInRef = true;
    }

    function isParticipatingInRef(uint256 tokenId) external view returns (bool) {
        return avatars[tokenId].isParticipatingInRef;
    }

    function getEquipments(uint256 tokenId) external view returns (uint256[] memory) {
        return equipments[tokenId];
    }

    function equip(uint256 tokenId, uint256 equipmentId) external onlyOwner {
        equipments[tokenId].push(equipmentId);
    }

    function removeEquipment(uint256 tokenId, uint256 equipmentId) external onlyOwner {
        uint256[] storage equipmentList = equipments[tokenId];
        for (uint256 i = 0; i < equipmentList.length; i++) {
            if (equipmentList[i] == equipmentId) {
                // Remove the equipment from the array
                equipmentList[i] = equipmentList[equipmentList.length - 1];
                equipmentList.pop();
                return;
            }
        }
    }

    function getBadges(uint256 tokenId) external view returns (uint256[] memory) {
        return badges[tokenId];
    }

    function awardBadge(uint256 tokenId, uint256 badgeId) external onlyOwner {
        badges[tokenId].push(badgeId);
    }

    function removeBadge(uint256 tokenId, uint256 badgeId) external onlyOwner {
        uint256[] storage badgeList = badges[tokenId];
        for (uint256 i = 0; i < badgeList.length; i++) {
            if (badgeList[i] == badgeId) {
                // Remove the badge from the array
                badgeList[i] = badgeList[badgeList.length - 1];
                badgeList.pop();
                return;
            }
        }
    }
}