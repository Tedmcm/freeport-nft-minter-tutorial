import { importProvider, getFreeportAddress, createFreeport, getNFTAttachmentAddress, createNFTAttachment } from "@cere/freeport-sdk";
import { get as httpGet, post as httpPost } from "axios";
import bs58 from 'bs58';

const API_ENV = "stage";

export const connectWallet = async () => {
  // Check if window.ethereum is enabled in your browser (i.e., metamask is installed)
  if (window.ethereum) {
    try {
      // Prompts a metamask popup in browser, where the user is asked to connect a wallet.
      const addressArray = await window.ethereum.request({method: "eth_requestAccounts"});
      // Return an object containing a "status" message and the user's wallet address.
      return { status: "Follow the steps below.", address: addressArray[0] };
    } catch (err) { return { address: "", status: err.message}; }
    // Metamask injects a global API into websites visited by its users at 'window.ethereum'.
    // If window.ethereum is not enabled, then metamask must not be installed. 
  } else { return { address: "", status: "Please install the metamask wallet" }; }
};

export const getCurrentWalletConnected = async () => {
  if (window.ethereum) {
    try {
      // Get the array of wallet addresses connected to metamask
      const addressArray = await window.ethereum.request({ method: "eth_accounts" });
      // If it contains at least one wallet address
      if (addressArray.length > 0) {
        return { address: addressArray[0], status: "Follow the steps below." };
        // If this list is empty, then metamask must not be connected.
      } else { return { address: "", status: "Please connect to metamask." }; }
      // Catch any errors here and return them to the user through the 'status' state variable.
    } catch (err) { return { address: "", status: err.message }; }
    // Again, if window.ethereum is not enabled, then metamask must not be installed.
  } else { return { address: "", status: "Please install the metamask wallet" }; }
};


export const upload2DDC = async (gatewayUrl, sessionToken, minter, minterEncryptionKey, data, preview, title, description) => {
    const uploadData = {
        minter, // Owner address
        file: data, // binary file
        preview,
        minterEncryptionKey, // Minter encryption key
        title, // Asset title
        description //Descriptive text
    };
    const uploadUrl = `${gatewayUrl}/assets/v2`;
    const httpRes = await upload(uploadUrl, uploadData, sessionToken);
    const contentId = httpRes.data;
    const previewUrl = `${gatewayUrl}/assets/v2/${minter}/${contentId}/preview`;
    return {contentId, previewUrl, status: "Upload successful"};
};

// Post HTTP request, parse response and return uploadId
const upload = async (url, data, sessionToken) => {
  const mainFile = data.file;
  const previewFile = data.preview;

  // Prepare Form data
  const fdata = new FormData();
  fdata.append('asset', mainFile);
  fdata.append('preview', previewFile);
  fdata.append('contentType', mainFile.type);
  fdata.append('description', data.description);
  fdata.append('title', data.title);

  const headers = {
    'Content-Type': 'multipart/form-data',
    Authorization: `Bearer ${sessionToken}`
  };
  return httpPost(url, fdata, { headers });
};


export const downloadFromDDC = async (gatewayUrl, sessionToken, provider, minter, contentId) => {
  const signer = provider.getSigner();
  // Wait one second.
  await sleepFor(1);
  // Create the signature 
  const signature = await signer.signMessage(`${minter}${contentId}${minter}`); 
  // Construct a set of key/value pairs representing the fields required by the Cere DDC API. 
  const headers = { 
    'X-DDC-Signature': signature, 
    'X-DDC-Address': minter,
    Authorization: `Bearer ${sessionToken}`
  };
  const downloadUrl = `${gatewayUrl}/assets/v2/${minter}/${contentId}/content`;
  const results = await httpGet(downloadUrl, {
      responseType: 'blob',
      headers
  });
  // Return the downloaded data
  return { status: "Download complete.", content: results.data };
};

export const mintNFT = async (quantity, metadata) => {
  // Do not allow the user to mint an NFT without metadata. Must not be empty string. 
  if (metadata.trim() === "" || (quantity < 1)) { return { success: false, status: "Please complete all fields before minting." } }
  // Create a new provider, which is an abstraction of a connection to the Ethereum network.
  const provider = importProvider();
  // Select 'dev', 'stage', or 'prod' environment to determine which smart contract to use. Default is 'prod'.
  const env = API_ENV;
  // Get the appropriate Freeport contract address, based on environment selected above.
  const contractAddress = await getFreeportAddress(provider, env);
  console.log("CA", contractAddress)
  // Create an instance of the Freeport contract using the provider and Freeport contract address
  const contract = createFreeport( { provider, contractAddress } );
  console.log("freeport contract ", contract);
  try {
    // Call the issue() function from the Freeport smart contract.
    const tx = await contract.issue(quantity, utilStr2ByteArr(metadata));
    const receipt = await tx.wait();
    const nftId = receipt.events[0].args[3].toString(); 
    // Return the transaction hash and the NFT id.  
    return { status: "Minting complete.", tx: tx.hash, nftId: nftId }
    // If something goes wrong, catch that error. 
  } catch (error) { return { status: "Something went wrong: " + error.message }; }
};

export const attachNftToCid = async (nftId, cid) => {
  // Do not allow the user call this function without a nftId and cid 
  if ( !nftId || !cid) { return { success: false, status: "Please complete all fields before attaching." } }
  // Create a new provider, which is an abstraction of a connection to the Ethereum network.
  const provider = importProvider();
  // Select 'dev', 'stage', or 'prod' environment to determine which smart contract to use. Default is 'prod'.
  const env = API_ENV;
  // Get the appropriate Freeport contract address, based on environment selected above.
  const contractAddress = await getNFTAttachmentAddress(provider, env);
  // Create an instance of the Freeport contract using the provider and Freeport contract address
  const contract = createNFTAttachment({ provider, contractAddress });
  // You need 46 bytes to store a IPFS CID.
  // If you express it in hexadecimal, it becomes 34 bytes long (68 characters with 1 byte per 2 characters).
  // However, the first two characters of the hexadecimal represent the hash function being used.
  // Since that's the only format that IPFS uses, 
  // we drop this information and obtain a 32 byte long value that fits in a bytes32 fixed-size byte array.
  const bytes32FromIpfsHash = "0x"+bs58.decode(cid).slice(2).toString('hex');
  try {
    // Call the attachToNFT() function from the CreateNFTAttachment smart contract.
    const tx = await contract.attachToNFT(nftId, bytes32FromIpfsHash);
    // Return the transaction hash of this attachement.  
    return { success: true, status: "NFT and CID attached.", tx: tx.hash };
    // If something goes wrong, catch that error. 
  } catch (error) { return { success: false, status: "Something went wrong: " + error.message }; }
};

// Helper functions
const sleepFor = async (x) => new Promise((resolve, _) => {
  setTimeout(() => resolve(), x*1000); 
});

export const utilStr2ByteArr = (str) => {
    const arr = [];
    for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i));
    }
    return arr;
}
