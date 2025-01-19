// Address type (can be Ethereum address or L2 address)
export type Address = string;

// Token structure
export interface Token {
    address: Address;
    amount: number;
}

// Transfer object received from the user
export interface TransferObject {
    sender: Address;
    token: Token;
    targetChain: {
        chainId: number;
        receiver: Address;
    };
    refund: {
        chainId: number;
        tx: Tx;
        signedTx: string;
    };
    signature: string;
}

// Transaction type
export interface Tx {
    to: Address;
    data: string;
    value: number;
}

export interface SignatureVerificationResult {
    valid: boolean;
    error?: string;
}

// User balance record
export interface UserBalance {
    [tokenAddress: string]: number;
}
