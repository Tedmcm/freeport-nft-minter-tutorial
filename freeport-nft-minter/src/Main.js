import { React, useEffect, useState, useContext } from "react";
import { connectWallet, getCurrentWalletConnected, mintNFT, upload2DDC, downloadFromDDC, attachNftToCid } from "./actions.js";

import { get as httpGet, post as httpPost } from "axios";
import LocalStorage from "local-storage";
import Button from 'react-bootstrap/Button';
import { importProvider, } from "@cere/freeport-sdk";
import {
    utilProvider2Ethereum,
    utilGetAccounts,
    utilGetOwnerAddress,
    utilGetEncPubKey,
    utilSign,
} from "./util";

const PROXY_SERVER = "https://ddc.freeport.dev.cere.network";


const Main = (props) => {

  // State variables - Connecting wallet
  const [walletAddress, setWalletAddress] = useState("");
  // State variables - Upload content
	const [uploadData, setUploadData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploadDataTitle, setUploadDataTitle] = useState("")
  const [uploadDataDescription, setUploadDataDescription] = useState("")
  const [cid, setCid] = useState(null);
  // State variables - Download content
  const [preview, setPreview] = useState(null);
  const [previewMain, setPreviewMain] = useState(null);
  const [downloadedImage, setDownloadedImage] = useState(null);
  // State variables - Mint NFT
  const [metadata, setMetadata] = useState("");
  const [qty, setQty] = useState(1);
  const [nftId, setNftId] = useState(null);
  // State variables - Statuses
  const [status, setStatus] = useState("");
  const [uploadOutput, setUploadOutput] = useState("Content ID:");
  const [mintOutput, setMintOutput] = useState("NFT ID:");
  const [attachOutput, setAttachOutput] = useState("Attachment transaction link:");

  const [sessionToken, setSessionToken] = useState(null);
  const [minter, setMinter] = useState(null);
  const [minterEncryptionKey, setMinterEncryptionKey] = useState(null);
  const [provider, setProvider] = useState(null);

  function addWalletListener() {
    // Check if metamask is installed 
    if (window.ethereum) {
        // Listen for state changes in the metamask wallet such as:
        window.ethereum.on("accountsChanged", (accounts) => {
          // If there is at least one account, update the state variables 'walletAddress' and 'status'
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setStatus("Follow the steps below.");
          // If metamask is installed but there are no accounts, then it must not be connected.
          } else { setStatus("Connect to Metamask using the top right button."); }
        });
      // If metamask is not installed, then ask them to install it. 
    } else { setStatus("Please install metamask and come back"); }
  };

  const connectWalletPressed = async () => {
    // Call our connectWallet function from the previous step and await response.
    const { status, address } = await connectWallet();
    setStatus(status);
    setWalletAddress(address);
  };

  useEffect(async () => {
    // The 'callback' side-effect logic
    const {address, status} = await getCurrentWalletConnected();
    setWalletAddress(address)
    setStatus(status); 
    addWalletListener();
    // The 'dependencies' array
  }, []);

  const onUploadPressed = async () => {
    const { contentId, previewUrl, status } = await upload2DDC(PROXY_SERVER, 
        sessionToken, 
        minter, 
        minterEncryptionKey, 
        uploadData, 
        previewData, 
        uploadDataTitle, 
        uploadDataDescription);
    setStatus(status);
    setUploadOutput("Content ID: " + contentId);
  }

  const onDownloadPressed = async () => {
    const { status, content} = await downloadFromDDC(cid);
    setStatus(status);
    setDownloadedImage(URL.createObjectURL(content));
  };

  const onMintPressed = async () => {
    const { tx, nftId, status } = await mintNFT(+qty, metadata)
    setStatus(status);
    setMintOutput("NFT ID: " + nftId);
  };


  const onAttachPressed = async () => {
    const { status, tx } = await attachNftToCid(nftId, cid);
    setStatus(status);
    setAttachOutput(<a href={"https://mumbai.polygonscan.com/tx/"+tx}>Attachment transaction hash: {tx}</a>)
  };

  const onClearOutputPressed = async () => {
    setStatus("Follow the steps below.");
    setUploadData(null);
    setPreview(null);
    setUploadOutput("Content ID:")
    setMintOutput("NFT ID:")
    setAttachOutput("Attachment transaction link:")
  };
  const login = async () => {
    const provider = importProvider();
    const ethereum = utilProvider2Ethereum(provider);
    const accounts = await utilGetAccounts(ethereum);
    const minter = await utilGetOwnerAddress(ethereum, accounts);
    const minterEncryptionKey = await utilGetEncPubKey(ethereum, accounts);

    const url = PROXY_SERVER;

    const nonce = await getNonce(minter, url);
    const sessionToken = await authorize(url, provider, minter, minterEncryptionKey, nonce);

    LocalStorage.set('minter', minter);
    LocalStorage.set('minterEncryptionKey', minterEncryptionKey);
    LocalStorage.set('sessionToken', sessionToken);

    setMinter(minter);
    setMinterEncryptionKey(minterEncryptionKey);
    setProvider(provider);
    setSessionToken(sessionToken);
  };
  const logout = () => {
    setMinter(null);
    setMinterEncryptionKey(null);
    setProvider(null);
    setSessionToken(null);
    LocalStorage.set('minter', null);
    LocalStorage.set('minterEncryptionKey', null);
    LocalStorage.set('sessionToken', null);
  };
    // read from local storage
  useEffect(() => {
    
    const minter = LocalStorage.get('minter');
    const minterEncryptionKey = LocalStorage.get('minterEncryptionKey');
    const sessionToken = LocalStorage.get('sessionToken');

    setMinter(minter);
    setMinterEncryptionKey(minterEncryptionKey);
    setSessionToken(sessionToken);
  })


  const AuthenticatedView = () => (
    <div>
      <MetamaskLogout address={minter} logout={logout}/>
      <h2> Upload your content to DDC </h2>
      <div>
        <form className="form" id="myform">
        Main image: 
      <img alt="main image" src={previewMain} style={{width: "200px"}}></img>
        <input name="file" type="file" id="inpFile"  onChange={(event) => { setUploadData(event.target.files[0]); setPreviewMain(URL.createObjectURL(event.target.files[0])); }}></input>
        Preview image:
      <img alt="preview image" src={preview} style={{width: "200px"}}></img>
         <input name="preview" type="file" id="previewFile" onChange={(event) => {setPreviewData(event.target.files[0]); setPreview(URL.createObjectURL(event.target.files[0])); }}></input>
        </form>
      </div>
      &nbsp;
      <input type="text" placeholder="Give your content a title." value={uploadDataTitle} onChange={(event) => setUploadDataTitle(event.target.value)}/>
      &nbsp;
      <input type="text" placeholder="Give your content a description." value={uploadDataDescription} onChange={(event) => setUploadDataDescription(event.target.value)}/>
      <button id="actionButton" onClick={onUploadPressed}> Upload </button>      

      <h2> Verify that your content was uploaded by downloading it from DDC </h2>
      <input type="text" placeholder="Enter content ID returned from upload step." onChange={(event) => setCid(event.target.value)}/>
      <button id="actionButton" onClick={onDownloadPressed}> Download </button>      

      <input type="number" placeholder="Enter the number of copies to mint." value={qty} onChange={(event) => setQty(event.target.value)}/>
      <button id="actionButton" onClick={onMintPressed}> Mint NFT</button>      

      <br></br><br></br>
      <h2> Attach NFT to CID </h2>
      <input type="text" placeholder="Enter your NFT id." onChange={(event) => setNftId(event.target.value)}/>
      &nbsp;
      <input type="text" placeholder="Enter your content id." onChange={(event) => setCid(event.target.value)}/>
      <button id="actionButton" onClick={onAttachPressed}> Attach</button>      
    </div>
    );


  return (   
    <div className="Main">
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? ("Connected: " + String(walletAddress).substring(0, 6) + "..." + String(walletAddress).substring(38)) : (<span>Connect Wallet</span>)}
      </button>
      <h1 id="title"> Create an NFT with Cere Freeport and DDC </h1>

      <div className="header">
        <h3>Status message:</h3>
      <p id="status"> {status} </p>
      </div>

      <div className="header2">
        <h3>Outputs:</h3>
      <p id="output"> {uploadOutput} </p>
      <p id="output"> Downloaded image: </p>
      {downloadedImage ? <img src={downloadedImage} style={{width: "200px"}}></img>: null}
      <p id="output"> {mintOutput} </p>
      <p id="output"> {attachOutput} </p>
      </div>
      <button id="actionButton" onClick={onClearOutputPressed}>Clear output</button>      
      
      <h2> Login using Metamask </h2>
      <p>
      Logging in with Metamask allows you to setup a session with the DDC Gateway
      to minimize wallet (e.g. metamask) interactions.  The Gateway caches the encryption key
      and significantly improves usability when you upload files multiple times (e.g. drag and 
      drop scenarios)
      </p>
      { sessionToken ? AuthenticatedView() : MetamaskLogin({url: PROXY_SERVER, login: login})
      } 


    </div>
  );
};


const MetamaskLogin = ({login}) => (
    <Button onClick={login}> Login with Metamask </Button>
);
const MetamaskLogout = ({logout, address}) => (
    <div>
      <Button variant="primary" onClick={logout}> Logout </Button>
    </div>
);

// Authorize
const authorize = async (baseUrl, provider, minter, encryptionPublicKey, nonce) => {
  const msgToSign = `${minter}${encryptionPublicKey}${nonce}`;
    const signature = await utilSign(provider, minter, msgToSign);
    const authUrl = `${baseUrl}/auth/v1/${minter}`;
    const result = await httpPost(authUrl, {encryptionPublicKey, signature});
    console.log("Auth result", result.data);
    const token = result.data.accessToken;
    return token;
};

// Get NONCE for session
const getNonce = async (minter, baseUrl) => {
  const result = await httpGet(`${baseUrl}/auth/v1/${minter}/nonce`);
  console.log("NONCE is", result.data);
  return result.data;
};


export default Main;