const { expect } = require("chai");

// We use `loadFixture` to share common setups (or fixtures) between tests.
// Using this simplifies your tests and makes them run faster, by taking
// advantage or Hardhat Network's snapshot functionality.
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

describe("Avatar contract", function () {
  // Define a function to deploy the Avatar contract and mint an avatar for the owner
  async function deployAvatarFixture() {
    // Get the ContractFactory and Signers here.
    const Avatar = await ethers.getContractFactory("Avatar");
    const [owner, addr1, addr2] = await ethers.getSigners();

    // To deploy our contract, we just have to call Avatar.deploy() and await
    // for it to be deployed(), which happens once its transaction has been
    // mined.
    const avatar = await Avatar.deploy("YOUR_BASE_URI");

    await avatar.deployed();

    // Mint an Avatar for the owner
    await avatar.mint("OWNER_IMAGE_URI");

    // Fixtures can return anything you consider useful for your tests
    return { Avatar, avatar, owner, addr1, addr2 };
  }

  // You can nest describe calls to create subsections.
  describe("Deployment", function () {
    // Test case to check if the owner is set correctly during deployment
    it("Should set the right owner", async function () {
      // We use loadFixture to set up our environment, and then assert that
      // things went well
      const { avatar, owner } = await loadFixture(deployAvatarFixture);

      // Expect the owner variable stored in the contract to be
      // equal to our Signer's owner.
      expect(await avatar.owner()).to.equal(owner.address);
    });

    // Test case to check if the base URI is set correctly during deployment
    it("Should have the correct base URI", async function () {
      const { avatar } = await loadFixture(deployAvatarFixture);
      expect(await avatar.getDefaultImage()).to.equal("YOUR_BASE_URI");
    });
  });

  // Describe the functionality of the Avatar contract
  describe("Avatar functionality", function () {
    // Test case to check if the avatar image can be changed
    it("Should change avatar image", async function () {
      const { avatar, owner } = await loadFixture(deployAvatarFixture);

      // Change the avatar image
      await avatar.connect(owner).changeAvatarImage(1, "NEW_IMAGE_URI");

      // Verify that the image was changed
      const avatarInfo = await avatar.avatars(1);
      expect(avatarInfo.image).to.equal("NEW_IMAGE_URI");
    });

    // Test case to check if equipment can be equipped and removed
    it("Should equip and remove equipment", async function () {
      const { avatar, owner } = await loadFixture(deployAvatarFixture);

      // Equip an item
      await avatar.connect(owner).equip(1, 100);

      // Verify equipment
      const equipmentList = await avatar.getEquipments(1);
      const equipmentIds = equipmentList.map(id => id.toNumber()); 
      expect(equipmentIds).to.include(100);

      // Remove the equipment
      await avatar.connect(owner).removeEquipment(1, 100);

      // Verify removal
      const updatedEquipmentList = await avatar.getEquipments(1);
      const updatedEquipmentIds = updatedEquipmentList.map(id => id.toNumber()); // Convert to JavaScript numbers
      expect(updatedEquipmentIds).to.not.include(100);
    });

    // Test case to check if a badge can be awarded and removed
    it("Should award and remove badge", async function () {
      const { avatar, owner } = await loadFixture(deployAvatarFixture);

      // Award a badge
      await avatar.connect(owner).awardBadge(1, 200);
    
      // Verify badges
      const badgeList = await avatar.getBadges(1);
      const badgeIds = badgeList.map(id => id.toNumber()); // Convert to JavaScript numbers
      expect(badgeIds).to.include(200);
    
      // Remove the badge
      await avatar.connect(owner).removeBadge(1, 200);
    
      // Verify removal
      const updatedBadgeList = await avatar.getBadges(1);
      const updatedBadgeIds = updatedBadgeList.map(id => id.toNumber()); // Convert to JavaScript numbers
      expect(updatedBadgeIds).to.not.include(200);
    });
  });
});
