const fs = require('fs')
const path = require('path')
const util = require('util')

const { network } = require('hardhat')
const { parseEther, formatEther } = require("ethers/lib/utils")

const ubeswapRouterAbi = [{"inputs":[{"internalType":"address","name":"_factory","type":"address"}],"stateMutability":"nonpayable","type":"constructor"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"amountADesired","type":"uint256"},{"internalType":"uint256","name":"amountBDesired","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"addLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"},{"internalType":"uint256","name":"liquidity","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"factory","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountIn","outputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"reserveIn","type":"uint256"},{"internalType":"uint256","name":"reserveOut","type":"uint256"}],"name":"getAmountOut","outputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsIn","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"}],"name":"getAmountsOut","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"}],"name":"pairFor","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"reserveA","type":"uint256"},{"internalType":"uint256","name":"reserveB","type":"uint256"}],"name":"quote","outputs":[{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"removeLiquidity","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"tokenA","type":"address"},{"internalType":"address","name":"tokenB","type":"address"},{"internalType":"uint256","name":"liquidity","type":"uint256"},{"internalType":"uint256","name":"amountAMin","type":"uint256"},{"internalType":"uint256","name":"amountBMin","type":"uint256"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"},{"internalType":"bool","name":"approveMax","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"removeLiquidityWithPermit","outputs":[{"internalType":"uint256","name":"amountA","type":"uint256"},{"internalType":"uint256","name":"amountB","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountIn","type":"uint256"},{"internalType":"uint256","name":"amountOutMin","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapExactTokensForTokensSupportingFeeOnTransferTokens","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"amountOut","type":"uint256"},{"internalType":"uint256","name":"amountInMax","type":"uint256"},{"internalType":"address[]","name":"path","type":"address[]"},{"internalType":"address","name":"to","type":"address"},{"internalType":"uint256","name":"deadline","type":"uint256"}],"name":"swapTokensForExactTokens","outputs":[{"internalType":"uint256[]","name":"amounts","type":"uint256[]"}],"stateMutability":"nonpayable","type":"function"}]

async function main() {
  const deploymentDetails = { }
  const mkdir = util.promisify(fs.mkdir)
  const writeFile = util.promisify(fs.writeFile)
  const abiDir = path.resolve(__dirname, `../deployments/`)
  const deploymentPath = path.resolve(__dirname, `../deployments/${network.name}.json`)

  console.log('Loading wallets...')
  const [deployer] = await ethers.getSigners()
  console.log(
    " - Deploying the contracts with the account:",
    await deployer.address
  )
  console.log(` - Account balance before deploying: ${formatEther(await deployer.getBalance())} CELO`)
  console.log()

  console.log(`Fetching contract factories...`)
  const MockERC20 = await ethers.getContractFactory("MockERC20")
  const TreeContract = await ethers.getContractFactory("TreeContract")
  const GreenDonation = await ethers.getContractFactory("GreenDonation")
  const RetirementCertificateEscrow = await ethers.getContractFactory("RetirementCertificateEscrow")
  console.log()

  console.log(`Deploying Mock tokens...`)
  console.log(` - Deploying Mock Reward Token...`)
  const rewardToken = await MockERC20.deploy('RWD TKN', 'RWD')
  await rewardToken.deployed()
  deploymentDetails['RewardToken'] = {
    contractNameForAbi: 'MockERC20',
    abi: rewardToken.interface,
    address: rewardToken.address,
  }
  console.log(` - Deploying Mock Staking Token...`)
  const stakingToken = await MockERC20.deploy('STK TKN', "STK")
  await stakingToken.deployed()
  deploymentDetails['StakingToken'] = {
    contractNameForAbi: 'MockERC20',
    abi: stakingToken.interface,
    address: stakingToken.address,
  }
  console.log()

  console.log(`Deploying Protocol Core Contracts...`)
  console.log(` - Deploying TreeContract...`)
  const treeContract = await TreeContract.deploy('')
  await treeContract.deployed()
  deploymentDetails['TreeContract'] = {
    contractNameForAbi: 'TreeContract',
    abi: treeContract.interface,
    address: treeContract.address,
  }
  console.log(` - Deploying RetirementCertificateEscrow...`)
  const retirementCertificateEscrow = await RetirementCertificateEscrow.deploy()
  await retirementCertificateEscrow.deployed()
  deploymentDetails['RetirementCertificateEscrow'] = {
    contractNameForAbi: 'RetirementCertificateEscrow',
    abi:retirementCertificateEscrow.interface,
    address: retirementCertificateEscrow.address,
  }
  console.log(` - Deploying GreenDonation...`)
  const greenDonation = await GreenDonation.deploy(
    await deployer.address, // Rewards distribution
    await rewardToken.address,
    await stakingToken.address,
    1 * 24 * 60 * 60, // Reward duration
    "0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121", // Swap router
    "0xF0a5bF1336372FdBc2C877bCcb03310D85e0BF81", // TC02
    "0xd4de140b1064a40a00cd756ab812181e7e14da04", // TC02 retirement certificate
    await treeContract.address,
    await retirementCertificateEscrow.address
  )
  deploymentDetails['GreenDonation'] = {
    contractNameForAbi: 'GreenDonation',
    abi: greenDonation.interface,
    address: greenDonation.address
  }
  console.log()

  console.log(`Linking Protocol Core Contracts...`)
  await treeContract.setGreenDonationContract(await greenDonation.address)
  await retirementCertificateEscrow.setGreenDonation(await greenDonation.address)
  await retirementCertificateEscrow.setTreeContract(await treeContract.address)
  await retirementCertificateEscrow.setRetirementCertificate("0xd4de140b1064a40a00cd756ab812181e7e14da04")
  console.log()
  
  console.log('Adding rewards to GreenDonation...')
  console.log(` - Minting Reward Token for GreenDonation rewards...`)
  const mintTx = await rewardToken.mint(greenDonation.address, parseEther('10'))
  const userMintTx = await rewardToken.mint(await deployer.getAddress(), parseEther('10'))
  console.log(' - Awaiting for successful mint...')
  await mintTx.wait(1)
  await userMintTx.wait(1)
  console.log(` - Setting minted in GreenDonation...`)
  const tx = await greenDonation.notifyRewardAmount(parseEther('10'))
  await tx.wait(1)
  console.log()

  console.log('Adding liquidity to ubeswap pair...')
  const tc02 = await ethers.getContractAt('ERC20', '0xF0a5bF1336372FdBc2C877bCcb03310D85e0BF81')
  const ubeswapRouter = await ethers.getContractAt(ubeswapRouterAbi, '0xE3D8bd6Aed4F159bc8000a9cD47CffDb95F96121')
  console.log(' - Approving router to spend your tokens...')
  console.log(' - Awaiting successful approval...')
  const tc02ApprovalTx = await tc02.approve(ubeswapRouter.address, parseEther('1000'))
  await tc02ApprovalTx.wait(1)
  const rewardTokenApprovalTx = await rewardToken.approve(ubeswapRouter.address, parseEther('1000'))
  await rewardTokenApprovalTx.wait(1)
  console.log(' - Adding liquidity')
  const tc02Balance = await tc02.balanceOf(await deployer.getAddress())
  const rewardTokenBalance = await rewardToken.balanceOf(await deployer.getAddress())
  const addLiquidityTx = await ubeswapRouter.addLiquidity(
    rewardToken.address,
    tc02.address,
    rewardTokenBalance,
    tc02Balance,
    rewardTokenBalance.div(2).div(2),
    tc02Balance.div(2).div(2),
    await deployer.getAddress(),
    Math.floor(Date.now() / 1000) + 24 * 60 * 60
  )
  console.log(' - Awaiting successful addLiquidity...')
  await addLiquidityTx.wait(1)
  console.log()

  console.log(`Saving deployments...`)
  await mkdir(abiDir, { recursive: true });
  await writeFile(deploymentPath, JSON.stringify(deploymentDetails, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })