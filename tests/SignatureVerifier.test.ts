import { SignatureVerifier } from '../src/SignatureVerifier'; // Adjust the path as needed
import { TransferObject } from '../src/types';
import { ethers } from 'ethers';

describe('SignatureVerifier', () => {
    let transfer: TransferObject;

    beforeEach(async () => {
        const sender = ethers.Wallet.createRandom().address;
        const token = { address: '0xTokenAddress', amount: 100 };
        const targetChain = { chainId: 1, receiver: '0xReceiverAddress' };
        const refund = { chainId: 1, tx: { to: '0xRefundAddress', data: '0x', value: 0 }, signedTx: '0x' };
        const signature = await ethers.Wallet.createRandom().signMessage(JSON.stringify({ sender, token, targetChain, refund }));


        transfer = { sender, token, targetChain, refund, signature };
    });

    it('should verify a valid signature', () => {
        const result = SignatureVerifier.verifySignature(transfer);
        expect(result.valid).toBe(true);
    });

    it('should return invalid for an incorrect signature', () => {
        transfer.signature = '0xInvalidSignature'; // Modify the signature to be incorrect
        const result = SignatureVerifier.verifySignature(transfer);
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Invalid signature');
    });
});
