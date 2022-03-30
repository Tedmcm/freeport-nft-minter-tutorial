import { CONTRACT_ENV } from "./config";

import { get as httpGet, post as httpPost } from "axios";
import bs58 from 'bs58';

export const connectWallet = async () => {
  // Check if window.ethereum is enabled in your browser (i.e., metamask is installed)
  if (window.ethereum) {
    try {
      // Prompts a metamask popup in browser, where the user is asked to connect a wallet.
      const addressArray = await window.ethereum.request({ method: "eth_requestAccounts" });
      // Return an object containing a "status" message and the user's wallet address.
      return { status: "Follow the steps below.", address: addressArray[0] };
    } catch (err) { return { address: "", status: err.message }; }
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


export const upload2DDC = async (gatewayUrl, sessionToken, downer, downerEncryptionKey, data, preview, title, description) => {
  const uploadData = {
    downer, // Owner address
    file: data, // binary file
    preview,
    downerEncryptionKey, // Minter encryption key
    title, // Asset title
    description //Descriptive text
  };
  const uploadUrl = `${gatewayUrl}/assets/v2`;
  const httpRes = await upload(uploadUrl, uploadData, sessionToken);
  const contentId = httpRes.data;
  const previewUrl = `${gatewayUrl}/assets/v2/${downer}/${contentId}/preview`;
  return { contentId, previewUrl, status: "Upload successful" };
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


export const downloadFromDDC = async (gatewayUrl, sessionToken, provider, downer, contentId) => {
  const signer = provider.getSigner();
  // Wait one second.
  await sleepFor(1);
  // Create the signature 
  const signature = await signer.signMessage(`${downer}${contentId}${downer}`);
  // Construct a set of key/value pairs representing the fields required by the Cere DDC API. 
  const headers = {
    'X-DDC-Signature': signature,
    'X-DDC-Address': downer,
    Authorization: `Bearer ${sessionToken}`
  };
  const downloadUrl = `${gatewayUrl}/assets/v2/${downer}/${contentId}/content`;
  const results = await httpGet(downloadUrl, {
    responseType: 'blob',
    headers
  });
  // Return the downloaded data
  return { status: "Download complete.", content: results.data };
};



// Helper functions
const sleepFor = async (x) => new Promise((resolve, _) => {
  setTimeout(() => resolve(), x * 1000);
});

export const utilStr2ByteArr = (str) => {
  const arr = [];
  for (let i = 0; i < str.length; i++) {
    arr.push(str.charCodeAt(i));
  }
  return arr;
}
