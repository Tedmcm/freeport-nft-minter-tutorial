import {
    importProvider,
} from "@cere/freeport-sdk";
// import Web3 from 'web3';
// const web3 = new Web3(web3.currentProvider);

// What's the right abstraction for the "ethereum" object?
export const utilProvider2Ethereum = (provider) => provider.provider;
export const utilGetEncPubKey = async (ethereum, accounts) => ethereum
    .request({
        method: 'eth_getEncryptionPublicKey',
        params: [accounts[0]], // you must have access to the specified account
    });

export const utilGetOwnerAddress = async (ethereum, accounts) => accounts[0];
export const utilGetAccounts = async (ethereum) =>
	ethereum.request({ method: 'eth_requestAccounts' });

export const utilStr2ByteArr = (str) => {
    const arr = [];
    for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i));
    }
    return arr;
}

const sleep1 = async () => new Promise((resolve, _) => {
	setTimeout(() => resolve(), 1000);
})

export const utilSignUpload = async (provider, minter, data) =>
	utilSign(provider, minter, confirmUploadMsg(data));

export const utilSignDownload = async (provider, minter, cid, address) =>
	utilSign(provider, minter, confirmDownloadMsg(minter, cid, address));

export const utilSign = async (provider, minter, text) => {
	const signer = provider.getSigner();

	// For some reason, metamask throws error on the
	// signature part. Not sure if it's an issue on our
	// side or a metamask issue
	await sleep1();

	const signature = await signer.signMessage(text);
	return signature;
};

const confirmUploadMsg = (data) =>
    `Confirm asset upload
Title: ${data.title}
Description: ${data.description}
Address: ${data.minter}`;

const confirmDownloadMsg = (minter, cid, address) =>
    `Confirm identity:
Minter: ${minter}
CID: ${cid}
Address: ${address}`;


window.provider = importProvider();