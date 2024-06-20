# Overview
![image](https://github.com/IntoTheVerse/IntoTheVerse-Celo-Contracts/assets/43913734/afa530f6-320c-4c95-817b-4289754bd160)

### TO BE AUDITED
![image](https://github.com/IntoTheVerse/IntoTheVerse-Celo-Contracts/assets/43913734/e8c4dea0-1810-46f8-8d4b-e9d6eb1457ae)

<img width="1095" alt="image" src="https://github.com/IntoTheVerse/IntoTheVerse-Celo-Contracts/assets/43913734/eff37a0e-befe-4cc2-be9a-48093952efd4">

![image](https://github.com/IntoTheVerse/IntoTheVerse-Celo-Contracts/assets/43913734/dbb0628a-a241-4175-9f8e-b4cd106c99e6)

![image](https://github.com/IntoTheVerse/IntoTheVerse-Celo-Contracts/assets/43913734/8f5c8876-2ffe-4488-acf3-8c34c1bfb151)

![image](https://github.com/IntoTheVerse/IntoTheVerse-Celo-Contracts/assets/43913734/b57ab8a9-c51a-441d-93ad-ef331c573d57)

## Tests in Hardhat

```
yarn test
yarn run v1.22.21
$ hardhat test


  Avatar contract
    Deployment
      ✔ Should set the right owner (1022ms)
      ✔ Should have the correct base URI
    Avatar functionality
      ✔ Should change avatar image
      ✔ Should equip and remove equipment
      ✔ Should award and remove badge

  GreenDonation contract
    - Access restricted functions
      ✔  - Should setClaimInterval if owner (219ms)
      ✔  - Should not setClaimInterval if not owner
      ✔  - Should setRedemptionRate if owner
      ✔  - Should not setRedemptionRate if not owner
      ✔  - Should setSwapRouter if owner
      ✔  - Should not setSwapRouter if not owner
      ✔  - Should setTreeContract if owner
      ✔  - Should not setTreeContract if owner
      ✔  - Should setRetirementCertificateEscrow if owner
      ✔  - Should not setRetirementCertificateEscrow if owner
      ✔  - Should setRetirementCertificateEscrow if owner
      ✔  - Should not notifyRewardAmount if owner
    - Set rewards
      ✔  - Should notifyRewardAmount properly
    - Stake
      ✔  - Should stake (68ms)
      ✔  - Should not stake if not tree nft owner (66ms)
    - Withdraw
      ✔  - Should withdraw (79ms)
      ✔  - Should not withdraw if not tree nft owner (73ms)
    - Get reward
      ✔  - Should fetch reward (137ms)
      ✔  - Should not fetch reward if not nft owner (91ms)
      ✔  - Should fetch reward multiple times (175ms)
      ✔  - Should fetch reward as per setInterval (150ms)
      ✔  - Should not fetch reward as per setInterval (122ms)

  Marketplace contract
    - Access restricted functions
      ✔  - Should setRedemptionRate if owner (133ms)
      ✔  - Should not setRedemptionRate if not owner
      ✔  - Should setSwapRouter if owner
      ✔  - Should not setSwapRouter if not owner
      ✔  - Should setRetirementCertificateEscrow if owner
      ✔  - Should not setRetirementCertificateEscrow if not owner
    - List Item
      ✔  - Should listItem
      ✔  - Should not listItem if already listed
      ✔  - Should not listItem if not nft owner
      ✔  - Should not listItem if price <= 0
      ✔  - Should not listItem if NFT not approved
    - Cancel Listing
      ✔  - Should cancelListing
      ✔  - Should not cancelListing if not owner
      ✔  - Should not cancelListing if not listed
    - Update Listing
      ✔  - Should updateListing
      ✔  - Should not updateListing if not owner
      ✔  - Should not cancelListing if not listed
      ✔  - Should not cancelListing if newPrice = 0
    - Buy Item
      ✔  - Should buyItem (61ms)
      ✔  - Should reflect buyItem state in MarketplaceRetirementCertificateEscrow (71ms)
      ✔  - Should not buyItem if not listed
      ✔  - Should not buyItem if not value < price (47ms)
      ✔  - Should not buyItem if not value == 0 (45ms)

  MarketplaceRetirementCertificateEscrow contract
    - Access restricted functions
      ✔  - Should setNFTMarketplace if owner (121ms)
      ✔  - Should not setNFTMarketplace if not owner
      ✔  - Should setRetirementCertificate if owner
      ✔  - Should not setRetirementCertificate if not owner
    - Claim Retirement Certificate
      ✔  - Should claim retirement certificate from buying NFT on marketplace (88ms)
      ✔  - Should not claim retirement certificate from buying NFT on marketplace if not NFT current owner (79ms)
      ✔  - Should not affect other certificates when claimed 1 ceritificate (132ms)

  RetirementCertificateEscrow contract
    - Access restricted functions
      ✔  - Should setGreenDonation if owner (158ms)
      ✔  - Should not setGreenDonation if not owner
      ✔  - Should setTreeContract if owner
      ✔  - Should not setTreeContract if not owner
      ✔  - Should setRetirementCertificate if owner
      ✔  - Should not setRetirementCertificate if not owner
    - Claim Certificate
      ✔  - Should claim retirement certificate from staking (123ms)
      ✔  - Should not claim retirement certificate from staking if not tree owner (115ms)
      ✔  - Should claim retirement certificate from tree (120ms)
      ✔  - Should claim retirement certificate from both tree and staking (125ms)
      ✔  - Should not claim retirement certificate if not tree owner (113ms)
      ✔  - Should not claim retirement certificate if already claimed (132ms)
      ✔  - Should not affect other claim retirement certificate when 2 trees (223ms)
      ✔  - Should not affect other claim retirement certificate (199ms)
      ✔  - Should claim both retirement certificate (157ms)
      ✔  - Should claim both retirement certificate (231ms)

  Token contract
    Deployment
      ✔ Should set the right owner
      ✔ Should assign the total supply of tokens to the owner
    Transactions
Transferring from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 to 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 50 tokens
Transferring from 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 to 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc 50 tokens
      ✔ Should transfer tokens between accounts
Transferring from 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 to 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 50 tokens
Transferring from 0x70997970c51812dc3a010c7d01b50e0d17dc79c8 to 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc 50 tokens
      ✔ should emit Transfer events
      ✔ Should fail if sender doesn't have enough tokens

  TreeContract
    - Access restricted functions
      ✔  - Should set cost if owner (172ms)
      ✔  - Should not set cost if not owner
      ✔  - Should set green donation if owner
      ✔  - Should not set green donation if not owner
      ✔  - Should set base uri if owner
      ✔  - Should not set base uri if not owner
      ✔  - Should withdraw if owner
      ✔  - Should withdraw if owner
    - Tree levels
      ✔  - Should water tree if not green donation
      ✔  - Should water tree if not green donation
      ✔  - Should downgrade tree if not green donation (44ms)
    - Mint
      ✔  - Should mint 1 token
      ✔  - Should mint 10 token
      ✔  - Should mint 1 token properly when cost is 1 ETH
      ✔  - Should mint 8 token properly when cost is 1 ETH
      ✔  - Should not mint 8 token properly when cost is 1 ETH but less is sent
      ✔  - Should not mint 1 token properly when cost is 1 ETH and less amount is sent
      ✔  - Should not mint 2 token properly when cost is 1 ETH and less amount is sent
      ✔  - Should mint 10 token through out (52ms)
      ✔  - Should mint 10 token at once
      ✔  - Should not mint more than 10 token at once
      ✔  - Should not mint more than 10 token through out


  100 passing (6s)

✨  Done in 6.60s.



```


Transaction hashes for all functionality:


Listing NFT...
 - Token list tx hash is:-  `0x9e1ef80169215d114d94126e20829fc8ec90de07c11acc241a0c70edb260100c`
  Update listing NFT...
 - Update listing tx hash is:-  `0x90bc011f05e64ee3fbc678ba85fc9b8d6a84695e538630df40d8f71c6d956e02`  
Cancel NFT listing...
 - Token cancel list tx hash is:-  `0x3478e904f1c3b61ed2b573064aa180aed96dcbf683fa9411649f8027f4bb8d99`  
Listing NFT again...
 - Token list tx hash is:-    `0xa3038b775d0086e60593c271d9a795745ab849eec7efdb8fecb698d1d195f429`  
Buying NFT...
 - Buy NFT Tx hash is:-  `0x6c71ed35547d16d3161aa404891042968c5ca31a2734df16f011852d27784d7b`  
Claiming retirement certificate...
 - Claim retirement certificate Tx hash is:-  `0x08a20d71d3e74b286c74c392a999ef2653ef88bc693ee810baa60a0dcc2a6924`  
Withdraw NFT income...
 - Withdraw Tx hash is:-  `0x3c76880381f8f7f7fa5bfeda93b90ce077f532457e282aa73600e079d9d600a2`  
Minting TreeContract...
 - Tree mint tx hash is:-  `0xa350f9037b4a50efa86d9c61ef071dff51d95e09caf585f58d40cb8c36f676cb`

Staking...
 - Stake tx hash is:-   `0x371f4cf5792c26923ea57f08246e08224450cb2dc987c7cd6e71f3c181caedf8`

Claiming minting tree retirement certificate...
 - Claim certificate from minting tree tx hash is:-  `0x38bf3f9737074ef3e38d1c69f63e67d3f81bb7568865b37db46eedf513bd630c`

Claiming rewards...
 - Setting claimInterval to 0 for allowing claim more than once in demo env.
 - You have currently earned 0.0017361111111111 RWD reward tokens
 - Claim tx hash is:-  `0x44c93a48fe6a3a21715821a688c50a2590c9bae7c3ba8fc58480a1f1aded30f2`

Claiming rewards retirement certificate...
 - Claim certificate from rewards tx hash is:-  `0x5af47102233a642f62a3136fccd98ba595773acaa1f871938630366d70f8c568`

### Transaction 1:

[https://alfajores.celoscan.io/tx/0x8c18692802050dc39a1049ec9747e6b4fa06ac3645b0745af83317b7fbba3990](https://alfajores.celoscan.io/tx/0x8c18692802050dc39a1049ec9747e6b4fa06ac3645b0745af83317b7fbba3990)

When a tree is minted, 10% of the value (msg.value) is offset (for which we can see that a retirement certificate is minted) and 90% of the value stays in the tree contract. Along with retirement certificate the tree nft is also minted.

### Transaction 2:

[https://alfajores.celoscan.io/tx/0xb8d24a479e07b802aff69dffc7b75f641e3925059df3c0ac404c87352bbfca3f](https://alfajores.celoscan.io/tx/0xb8d24a479e07b802aff69dffc7b75f641e3925059df3c0ac404c87352bbfca3f)

This is a get rewards transaction- which transfers the rewards earned from staking. The logic here is same as the previous logic.





# Hardhat Boilerplate

This repository contains a sample project that you can use as the starting point
for your Ethereum project. It's also a great fit for learning the basics of
smart contract development.

This project is intended to be used with the
[Hardhat Beginners Tutorial](https://hardhat.org/tutorial), but you should be
able to follow it by yourself by reading the README and exploring its
`contracts`, `tests`, `scripts` and `frontend` directories.

## Quick start

The first things you need to do are cloning this repository and installing its
dependencies:

```sh
git clone https://github.com/NomicFoundation/hardhat-boilerplate.git
cd hardhat-boilerplate
npm install
```

Once installed, let's run Hardhat's testing network:

```sh
npx hardhat node
```

Then, on a new terminal, go to the repository's root folder and run this to
deploy your contract:

```sh
npx hardhat run scripts/deploy.js --network localhost
```

Finally, we can run the frontend with:

```sh
cd frontend
npm install
npm start
```

Open [http://localhost:3000/](http://localhost:3000/) to see your Dapp. You will
need to have [Coinbase Wallet](https://www.coinbase.com/wallet) or [Metamask](https://metamask.io) installed and listening to
`localhost 8545`.

## Functionality Explanation
 
MetaMeadow Boomtown Protocol

TreeContract:
● This is the protocol NFT.
● setGreenDonationContract(address _greenDonationContract):
○ This function can only be called by the owner.
○ This function sets the greenDonation contract address in the TreeContract.
● setRedemptionRate(uint256 _rate):
○ This function can only be called by the owner.
○ This function sets the redemptionRate in the TreeContract.
○ NOTE: redemptionRate is the variable that defines how much percentage of value is
to be offset. Default is 10 (meaning 10% of msg.value will be offset, remaining will be
in the contract).
● setSwapRouter(address router):
○ This function can only be called by the owner.
○ This function sets the swapRouter address in the TreeContract.
● setRetirementCertificateEscrow(address _retirementCertificateEscrow):
○ This function can only be called by the owner.
○ This function sets the address of the retirementCertificateEscrow in the
TreeContract.
● setCost(uint256 _cost):
○ This function can only be called by the owner.
○ This function sets the cost of the tree to be minted.
○ NOTE: cost is the variable that defines what will be the price of a single tree (NFT).
● mint(uint256 _quantity, string calldata beneficiaryString, string calldata retirementMessage):
○ This function mints the tree NFT to the user.
○ It can mint more than 1 NFT in a single transaction.
○ In total a user can mint only 10 NFTs (ir-respective if done in single transaction or
multiple transactions)
○ There is a max supply of `10000` set by the previous developer which is kept as is.
○ Parameters:
■ _quantity: This parameter is the no. of NFTs you wish to mint in a single transaction. NOTE: msg.value has to be passed according to the quantity.
■ beneficiaryString & retirementMessage: These are strings required when
offsetting TC02 to make on-chain data easy to understand/read.
○ NOTE: In case of minting more than 1 NFT in a single tx (i.e quantity > 1) the offset
will be done on entire msg.value (meaning cost for all NFTs to be minted) but the retirement certificate will be attached/assigned to the first NFT token id only.
            
 ● waterTree(uint256 _tokenId):
○ This function can only be called by GreenDonation.
○ It upgrades the level of the tree NFT when staking is done for a particular tree NFT.
● withdraw():
○ This function can only be called by the owner.
○ It withdraws the amount of native token that is present in the contract and sends
them to the contract owner.
● downgradeTree uint256 _tokenId):
○ This function can only be called by GreenDonation.
○ It downgrades the level of the tree NFT when staking is done for a particular tree
NFT.

 GreenDonation:
● This is the staking contract where user’s can stake for a NFT with another token and gain
rewards in a token.
● setClaimInterval(uint256 _interval):
○ This function can only be called by the owner.
○ This function sets the claiming interval epoch.
○ NOTE: claimInterval variable represents the amount of time that has to be passed
between claiming rewards.
● setRedemptionRate(uint256 _rate):
○ This function can only be called by the owner.
○ This function sets the redemptionRate.
○ NOTE: redemptionRate is the variable that defines how much percentage of value is
to be offset. Default is 10 (meaning 10% of msg.value will be offset, remaining will be
in the contract).
● setSwapRouter(address router):
○ This function can only be called by the owner.
○ This function sets the swapRouter address.
● setTreeContract(address _treeContract):
○ This function can only be called by the owner.
○ This function sets the treeContract address.
● setRetirementCertificateEscrow(address _retirementCertificateEscrow):
○ This function can only be called by the owner.
○ This function sets the address of the retirementCertificateEscrow.
● stake(uint256 tree, uint256 amount):
○ This function stakes a token for a given tree.
○ It accepts the mentioned token for stake.
○ This function can only be used by the owner of the tree NFT passed in parameters.
○ Parameters:
■ tree: This parameter represents the tree with which you want to associate the stake.
■ amount: This parameter represents the amount of a token you want to stake.
● withdraw(uint256 tree, uint256 amount):
○ This function withdraws staked tokens.
○ It returns the owner of the tree NFT the staked tokens requested in parameters.
○ This function can only be used by the owner of the tree NFT passed in parameters.
○ Parameters:
■ tree: This parameter represents the tree with which you have previously associated a stake.
■ amount: This parameter represents the amount of a token you want to withdraw.
       
 ● getReward(uint256 tree, string calldata beneficiaryString, string calldata retirementMessage):
○ This function claims the rewards generated by staking.
○ It returns the owner of the tree NFT the rewards generated (rewards generated -
rewards used to offset TC02)
○ This function can only be used by the owner of the tree NFT passed in parameters.
○ This function also uses redemptionRate(%) of the rewards to offset TC02 and
generate a retirement certificate which can be claimed later on from the escrow and
returns the remaining (rewards - offset) amount of the tree owner.
○ Parameters:
■ tree: This parameter represents the tree with which you have previously
associated a stake.
■ beneficiaryString & retirementMessage: These are strings required when
offsetting TC02 to make on-chain data easy to understand/read.
● exit(uint256 tree, string calldata beneficiaryString, string calldata
retirementMessage):
○ This function executes withdraw() and getReward() to withdraw and claim rewards in a single txn.
● notifyRewardAmount(uint256 reward):
○ This function sets/updates rewards for the staking.
○ It can only be called by the rewardsDistribution (address set in the contract when
deploying).
○ Depending on the state of contract, if a staking period is active it will adjust rewards
or it will start a new staking period for rewardsDuration (which is set in the contract
when deploying).
○ Parameters:
■ reward: The amount of reward tokens you want to add to the staking pool.

 RetirementCertificateEscrow:
● This is the escrow contract where user can claim the retirement certificate generated by
their tree NFTs.
● setGreenDonation(address _greenDonation):
○ This function can only be called by the owner.
○ This function sets the greenDonation address.
● setTreeContract(address _treeContract):
○ This function can only be called by the owner.
○ This function sets the treeContract address.
● setRetirementCertificate(address _retirementCertificate):
○ This function can only be called by the owner.
○ This function sets the address of the retirementCertificate.
● registerCertificateForClaim(uint256 tree, uint256 _retirementCertificate):
○ This function registers the retirement certificate generated by the tree’s offsetting to be claimable.
○ This function can only be used by the greenDonation contract or treeContract when offsetting is happening.
○ Parameters:
■ tree: This parameter represents the tree which has generated the
retirementCertificate.
■ _retirementCertificate: This parameter represents the
retirementCertificate tokenId generated.
● claimRetirementCertificate(uint256 tree, uint256[] memory
userRetirementCertificatesIndexes):
○ This function claims the retirementCertificates generated by the tree NFT and marked as claimable.
○ It transfers the retirementCertificates to the owner of the NFT tree.
○ This function can only be used by the owner of the tree NFT passed in parameters.
○ This function can claim more than 1 retirement certificate in one txn.
○ However, if any one of the retirementCertificate (from the submitted indexes) is
already claimed the entire txn reverts.
○ Parameters:
■ tree: This parameter represents the tree with which you have
retirementCertificates generated.
■ userRetirementCertificatesIndexes: This parameter represents the indexes
of the retirementCertificate in the array when they were registered for claim.
  
 NftMarketplace:
● setRedemptionRate(uint256 _rate):
○ This function can only be called by the owner.
○ This function sets the redemptionRate.
○ NOTE: redemptionRate is the variable that defines how much percentage of value is
to be offset. Default is 10 (meaning 10% of msg.value will be offset, remaining will be
in the contract).
● setSwapRouter(address router):
○ This function can only be called by the owner.
○ This function sets the swapRouter address.
● setRetirementCertificateEscrow(address _retirementCertificateEscrow):
○ This function can only be called by the owner.
○ This function sets the address of the retirementCertificateEscrow.
● listItem(address nftAddress, uint256 tokenId, uint256 price):
○ This function is used to list the NFT token id on the market as the specified price.
○ This function can only be called by the owner of the NFT token id.
○ Parameters:
■ nftAddress: The address of the NFT contract to list.
■ tokenId: The NFT (tokenId) to list to market for selling.
■ price: The price at which the NFT should be sold.
○ If the NFT tokenid is already listed, the user cannot list it again.
● cancelListing(address nftAddress, uint256 tokenId, uint256 price):
○ This function is used to cancel the listing of a already listed NFT token id.
○ This function can only be called by the owner of the NFT token id.
○ Parameters:
■ nftAddress: The address of the NFT contract.
■ tokenId: The NFT (tokenId) for which listing has to be cancelled.
○ If the NFT tokenid should be listed for this function to work.
● function updateListing(address nftAddress, uint256 tokenId, uint256 newPrice):
○ This function is used to modify the price of the NFT listed on the market.
○ This function can only be called by the owner of the NFT token id.
○ If the NFT tokenid should be listed for this function to work.
■ nftAddress: The address of the NFT contract to list.
■ tokenId: The NFT (tokenId) to list to market for selling.
■ newPrice: The new updated price at which the NFT should be sold.
● withdrawProceeds():
○ This function is used to withdraw the earnings from NFT selling.
○ It transfers all the earnings gained by a user from the NFT selling.
● function buyItem(address nftAddress, uint256 tokenId, string calldata
beneficiaryString, string calldata retirementMessage):
○ This function is used to buy the listed NFT from the market.
    
 ○ This will only work if msg.value > price of the listed NFT.
○ It will use redemptionRate(%) of funds for offsetting TC02- for which the
retirementCertificate can be claimed from the MarketplaceRetirementCertificateEscrow contract. The remaining funds will be marked as withdrawable for the listed owner of the NFT.
○ Parameters:
■ nftAddress: The address of the NFT contract to buy.
■ tokenId: The NFT (tokenId) to buy.
■ beneficiaryString & retirementMessage: These are strings required when
offsetting TC02 to make on-chain data easy to understand/read.
MarketplaceRetirementCertificateEscrow:
● This is the escrow contract where user can claim the retirement certificate generated by their buy transactions on the marketplace.

 ● setNFTMarketplace(address _marketplace):
○ This function can only be called by the owner.
○ This function sets the marketplace contract address in the contract.
● setRetirementCertificate(address _retirementCertificate):
○ This function can only be called by the owner.
○ This function sets the address of the retirementCertificate.
● registerCertificateForClaim(address nftAddress, uint256 tokenId, uint256 _retirementCertificate):
○ This function registers the retirement certificate generated by the buying of a NFT tokenid offsetting to be claimable.
○ This function can only be used by the marketplace contract when offsetting is happening.
○ Parameters:
■ nftAddress: The address of the NFT contract whose buying generated
retirement certificate.
■ tokenId: The token id of the NFT whose buying generated retirement
certificate.
■ _retirementCertificate: This parameter represents the
retirementCertificate tokenId generated.
● claimRetirementCertificate( address nftAddress, int256 tokenId, uint256[]
memory userRetirementCertificatesIndexes):
○ This function claims the retirementCertificates generated by the buying of NFT on marketplace and marked as claimable.
○ It transfers the retirementCertificates to the owner of the NFT token id.
○ This function can only be used by the owner of the NFT token id passed in
parameters.
○ This function can claim more than 1 retirement certificate in one txn.
○ However, if any one of the retirementCertificate (from the submitted indexes) is
already claimed the entire txn reverts.
○ Parameters:
■ nftAddress: The address of the NFT contract whose buying generated
retirement certificate.
■ tokenId: The token id of the NFT whose buying generated retirement
certificate.
■ userRetirementCertificatesIndexes: This parameter represents the indexes
of the retirementCertificate in the array when they were registered for claim.
 
## User Guide

You can find detailed instructions on using this repository and many tips in [its documentation](https://hardhat.org/tutorial).

- [Writing and compiling contracts](https://hardhat.org/tutorial/writing-and-compiling-contracts/)
- [Setting up the environment](https://hardhat.org/tutorial/setting-up-the-environment/)
- [Testing Contracts](https://hardhat.org/tutorial/testing-contracts/)
- [Setting up your wallet](https://hardhat.org/tutorial/boilerplate-project#how-to-use-it)
- [Hardhat's full documentation](https://hardhat.org/docs/)

For a complete introduction to Hardhat, refer to [this guide](https://hardhat.org/getting-started/#overview).

## What's Included?

This repository uses our recommended hardhat setup, by using our [`@nomicfoundation/hardhat-toolbox`](https://hardhat.org/hardhat-runner/plugins/nomicfoundation-hardhat-toolbox). When you use this plugin, you'll be able to:

- Deploy and interact with your contracts using [ethers.js](https://docs.ethers.io/v5/) and the [`hardhat-ethers`](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-ethers) plugin.
- Test your contracts with [Mocha](https://mochajs.org/), [Chai](https://chaijs.com/) and our own [Hardhat Chai Matchers](https://hardhat.org/hardhat-chai-matchers) plugin.
- Interact with Hardhat Network with our [Hardhat Network Helpers](https://hardhat.org/hardhat-network-helpers).
- Verify the source code of your contracts with the [hardhat-etherscan](https://hardhat.org/hardhat-runner/plugins/nomiclabs-hardhat-etherscan) plugin.
- Get metrics on the gas used by your contracts with the [hardhat-gas-reporter](https://github.com/cgewecke/hardhat-gas-reporter) plugin.
- Measure your tests coverage with [solidity-coverage](https://github.com/sc-forks/solidity-coverage).

This project also includes [a sample frontend/Dapp](./frontend), which uses [Create React App](https://github.com/facebook/create-react-app).

## Troubleshooting

- `Invalid nonce` errors: if you are seeing this error on the `npx hardhat node`
  console, try resetting your Metamask account. This will reset the account's
  transaction history and also the nonce. Open Metamask, click on your account
  followed by `Settings > Advanced > Clear activity tab data`.

## Setting up your editor

[Hardhat for Visual Studio Code](https://hardhat.org/hardhat-vscode) is the official Hardhat extension that adds advanced support for Solidity to VSCode. If you use Visual Studio Code, give it a try!

## Getting help and updates

If you need help with this project, or with Hardhat in general, please read [this guide](https://hardhat.org/hardhat-runner/docs/guides/getting-help) to learn where and how to get it.

For the latest news about Hardhat, [follow us on Twitter](https://twitter.com/HardhatHQ), and don't forget to star [our GitHub repository](https://github.com/NomicFoundation/hardhat)!

**Happy _building_!**
