const fs = require('fs')
const path = require('path')
const util = require('util')

const { network } = require('hardhat')
const { parseEther, formatEther } = require("ethers/lib/utils")

async function main() {
  const readFile = util.promisify(fs.readFile)
  const deploymentPath = path.resolve(__dirname, `../deployments/${network.name}.json`)
  
  console.log(`Loading deployments...`)
  const deployments = JSON.parse(await readFile(deploymentPath, 'utf8'))

  console.log(`Loading wallets`)
  const [deployer] = await ethers.getSigners()
  console.log(
    " - Deploying the contracts with the account:",
    await deployer.address
  )
  console.log(` - Account balance before deploying: ${formatEther(await deployer.getBalance())} CELO`)
  console.log()

  console.log(`Loading contracts...`)
  const stakingToken = await ethers.getContractAt(
    deployments.StakingToken.contractNameForAbi,
    deployments.StakingToken.address, 
    deployer
  )
  const treeContract = await ethers.getContractAt(
    deployments.TreeContract.contractNameForAbi,
    deployments.TreeContract.address,
    deployer
  )
  const greenDonation = await ethers.getContractAt(
    deployments.GreenDonation.contractNameForAbi,
    deployments.GreenDonation.address,
    deployer
  )
  const retirementCertificateEscrow = await ethers.getContractAt(
    deployments.RetirementCertificateEscrow.contractNameForAbi,
    deployments.RetirementCertificateEscrow.address,
    deployer
  )

  console.log('Approving and minting tokens for demo...')
  const mintTx = await stakingToken.mint(await deployer.getAddress(), parseEther('100000'))
  console.log(' - Awaiting successful mint...')
  mintTx.wait(1)
  const approvalTx = await stakingToken.approve(greenDonation.address, parseEther('100000'));
  console.log(' - Awaiting successful approval...')
  approvalTx.wait(1)
  console.log()

  console.log('Minting TreeContract...')
  const treeMintTx = await treeContract.mint(1);
  await treeMintTx.wait(1)
  console.log(' - Tree mint tx hash is:- ', treeMintTx.hash)
  console.log()

  console.log('Staking...')
  const stakeTx = await greenDonation.stake(1, parseEther('1').div(1000));
  await stakeTx.wait(1)
  console.log(' - Stake tx hash is:- ', stakeTx.hash)
  console.log()

  console.log('Claiming rewards...')
  console.log(` - You have currently earned ${formatEther(await greenDonation.earned(1))} RWD reward tokens`)
  const claimRewardsTx = await greenDonation.getReward(1, 'Test beneficiary', 'This is a test tx')
  await claimRewardsTx.wait(1)
  console.log(' - Claim tx hash is:- ', claimRewardsTx.hash)
  console.log()
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })