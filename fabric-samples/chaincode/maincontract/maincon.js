'use strict';
const { Contract } = require('fabric-contract-api');
class EvidenceContract extends Contract {
    async initLedger(ctx) {
        console.info('Chaincode instantiated');
    }
    async storeEvidence(ctx, evdString) {
        const {hash} = JSON.parse(evdString);
        await ctx.stub.putState(hash, Buffer.from(evdString));
        return {success:true,hash:hash};
    }
    async getEvidence(ctx,evID){
        const evBytes=await ctx.stub.getState(evID)
        if(!evBytes)return {msg:"invalid key",status:failed}
        return JSON.parse(evBytes.toString())
    }
}
module.exports = EvidenceContract;