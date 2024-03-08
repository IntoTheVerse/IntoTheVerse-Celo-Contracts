const fs = require('fs')
const path = require('path')
const util = require('util')

const { network } = require('hardhat')
const { formatEther, parseUnits } = require("ethers/lib/utils")

async function main() {
  const readFile = util.promisify(fs.readFile)
  const deploymentPath = path.resolve(__dirname, `../deployments/${network.name}.json`)
  
  console.log(`Loading deployments...`)
  const deployments = JSON.parse(await readFile(deploymentPath, 'utf8'))
  console.log()

  console.log(`Loading wallets...`)
  const provider = ethers.provider
  const gasPrice = (await provider.getGasPrice()).mul(2)
  const [deployer, buyer] = await ethers.getSigners()
  console.log(
    " - Deploying the contracts with the account:",
    await deployer.address
  )
    console.log(
    " - Loaded another account:",
    await buyer.address
  )
  console.log(` - Account balance before deploying: ${formatEther(await deployer.getBalance())} CELO`)
  console.log(` - Account balance before buying NFT: ${formatEther(await buyer.getBalance())} CELO`)
  console.log()

  console.log(`Loading contracts...`)
  const nft = await ethers.getContractAt(
    deployments.NFT.contractNameForAbi,
    deployments.NFT.address,
    deployer
  )
  const marketplace = await ethers.getContractAt(
    deployments.Marketplace.contractNameForAbi,
    deployments.Marketplace.address,
    deployer
  )
  const marketplaceRetirementCertificateEscrow = await ethers.getContractAt(
    deployments.MarketplaceRetirementCertificateEscrow.contractNameForAbi,
    deployments.MarketplaceRetirementCertificateEscrow.address,
    buyer
  )
  console.log()

  console.log('Approving and minting tokens for demo...')
  let tokenId = 1
  // const mintTx = await nft.connect(deployer).mint(await deployer.getAddress(), { gasPrice: gasPrice })
  // console.log(` - Awaiting successful mint for NFT tokenId ${tokenId}...`)
  // mintTx.wait(1)
  // provider.waitForTransaction(mintTx.hash, 2)

  // const approvalTx = await nft.connect(deployer).approve(deployments.Marketplace.address, tokenId, { gasPrice: gasPrice });
  // console.log(' - Awaiting successful approval...')
  // approvalTx.wait(1)
  // provider.waitForTransaction(approvalTx.hash, 2)
  // console.log()
  
  // console.log('Listing NFT...')
  // let listTx = await marketplace.connect(deployer).listItem(deployments.NFT.address, tokenId, parseUnits('1', 'gwei'));
  // await listTx.wait(1)
  // provider.waitForTransaction(listTx.hash, 2)
  // console.log(' - Token list tx hash is:- ', listTx.hash)
  // console.log()

  // console.log('Update listing NFT...')
  // const updateTx = await marketplace.connect(deployer).updateListing(deployments.NFT.address, tokenId, parseUnits('2', 'gwei'), { gasPrice: gasPrice });
  // await updateTx.wait(1)
  // provider.waitForTransaction(updateTx.hash, 2)
  // console.log(' - Update listing tx hash is:- ', updateTx.hash)
  // console.log()

  // console.log('Cancel NFT listing...')
  // const cancelTx = await marketplace.connect(deployer).cancelListing(deployments.NFT.address, tokenId, { gasPrice: gasPrice });
  // await cancelTx.wait(1)
  // provider.waitForTransaction(cancelTx.hash, 2)
  // console.log(' - Token cancel list tx hash is:- ', cancelTx.hash)
  // console.log()

  // console.log('Listing NFT again...')
  // listTx = await marketplace.connect(deployer).listItem(deployments.NFT.address, tokenId, parseUnits('1', 'gwei'), { gasPrice: gasPrice });
  // await listTx.wait(1)
  // provider.waitForTransaction(listTx.hash, 2)
  // console.log(' - Token list tx hash is:- ', listTx.hash)
  // console.log()

  // console.log('Buying NFT...')
  // const buyingTx = await marketplace.connect(buyer).buyItem(deployments.NFT.address, tokenId, 'Test beneficiary', 'This is a test tx', { value: parseUnits('1', 'gwei'), gasPrice: gasPrice })
  // await buyingTx.wait(1)
  // provider.waitForTransaction(buyingTx.hash, 2)
  // console.log(' - Buy NFT Tx hash is:- ', buyingTx.hash)
  // console.log()

  // console.log('Claiming retirement certificate...')
  // const claimTx = await marketplaceRetirementCertificateEscrow.connect(buyer).claimRetirementCertificate(deployments.NFT.address, tokenId, [0], { gasPrice: gasPrice })
  // await claimTx.wait(1)
  // provider.waitForTransaction(claimTx.hash, 2)
  // console.log(' - Claim retirement certificate Tx hash is:- ', claimTx.hash)
  // console.log()

  console.log('Withdraw NFT income...')
  const withdrawTx = await marketplace.connect(deployer).withdrawProceeds({ gasPrice: gasPrice })
  await withdrawTx.wait(1)
  provider.waitForTransaction(withdrawTx.hash, 2)
  console.log(' - Withdraw Tx hash is:- ', withdrawTx.hash)
  console.log()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })