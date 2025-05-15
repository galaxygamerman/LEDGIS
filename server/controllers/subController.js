const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..','..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
const walletPath = path.join(__dirname, '..','wallet');
async function subToFabric(functionName, args) {
  try {
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    const identity = await wallet.get('appUser');
    if (!identity) {
      return { error: 'No user identity' };
    }
    const gateway = new Gateway();
    await gateway.connect(ccp, { 
      wallet, 
      identity: 'appUser', 
      discovery: { enabled: true, asLocalhost: true } 
    });
    const network = await gateway.getNetwork('mychannel');
    const contract = network.getContract('maincontract');
    const result = await contract.submitTransaction(functionName, ...args);
    await gateway.disconnect();
    return { result: result.toString() };
  } catch (error) {
    console.error(`Failed to submit transaction: ${error}`);
    return { error: error.message };
  }
}
module.exports={subToFabric}