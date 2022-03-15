import { React, useEffect, useState, useContext, Fragment } from "react";
import { connectWallet, getCurrentWalletConnected, mintNFT, upload2DDC, downloadFromDDC, attachNftToCid } from "./actions.js";

import { get as httpGet, post as httpPost } from "axios";
import LocalStorage from "local-storage";

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Stack from 'react-bootstrap/Stack';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import PanelUpload from "./PanelUpload";
import PanelDownload from "./PanelDownload";
import PanelMetamaskLogin from "./PanelMetamaskLogin";
import PanelMint from "./PanelMint";
import PanelTransfer from "./Transfer";
import TokenListView from "./Lister";

import { importProvider } from "@cere/freeport-sdk";
import {
    utilProvider2Ethereum,
    utilGetAccounts,
    utilGetOwnerAddress,
    utilGetEncPubKey,
    utilSign,
} from "./util";

import {API_ENV, DDC_GATEWAY, API_GATEWAY} from "./config";

const Main = (props) => {
  // State variables - Connecting wallet
  const [walletAddress, setWalletAddress] = useState("");
  // State variables - Mint NFT
  const [nftId, setNftId] = useState(null);
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const [listOutput, setListOutput] = useState("");

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



  const onLoginPressed = async () => {
    const provider = importProvider();
    const ethereum = utilProvider2Ethereum(provider);
    const accounts = await utilGetAccounts(ethereum);
    const minter = await utilGetOwnerAddress(ethereum, accounts);
    const minterEncryptionKey = await utilGetEncPubKey(ethereum, accounts);

    const url = DDC_GATEWAY;

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

  const onLogoutPressed = () => {
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

  const PanelTokenList= () => (
    <Card bg="secondary" border="secondary" text="light">
      <Card.Header >
        <Card.Title style={{color: "white"}}>List</Card.Title>
        <Card.Subtitle className="mb-2">List my tokens</Card.Subtitle>
      </Card.Header >
      <Card.Body>
        <TokenListView env={API_ENV}/>
      </Card.Body>
      <Card.Footer>
      {listOutput && <Container>
          <Row> 
            <Col >
               {listOutput}
            </Col>
          </Row>  
          </Container>
      }
      </Card.Footer>
    </Card>      
  );

  const PanelAuthenticated = () => (
    <div>
      <h1 style={{color:"white"}}> Create an NFT with Cere Freeport and DDC </h1>
      <Container fluid="md" bg="dark">
        <Row>
          <Col className="col-10"/>
          <Col>
            <MetamaskLogout address={minter} logout={onLogoutPressed}/>
          </Col>
        </Row>
        <Row  lg={2} md={2} className="g-4">
        <Col >
          <PanelUpload 
            minter={minter} 
            sessionToken={sessionToken} 
            minterEncryptionKey={minterEncryptionKey}/>
        </Col>
        <Col>
          <PanelDownload
            provider={provider}
            minter={minter}
            sessionToken={sessionToken} 
          />
        </Col>
        <Col>
          <PanelMint/>
        </Col>
        <Col>
          <PanelAttach/>
        </Col>
        <Col>
          <PanelTransfer env={API_ENV}/>
        </Col>
        <Col>
          <PanelTokenList/>
        </Col>
      </Row>
      </Container>
    </div>
  );

  const WalletConnectPanel = () => (
    <div style={{float: "right"}}>
      <span style={{color:"white", float: "right"}}> Using {API_ENV} environment </span>
      <Button variant="secondary" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? 
          ("Connected: " + String(walletAddress).substring(0, 6) + "..." + String(walletAddress).substring(38)) 
          : 
          (<span>Connect Wallet</span>)
        }
      </Button>
    </div>
  );

  const MainPanel = () => (
    <div style={{backgroundColor:"black"}}>
      <Stack style={{color:"white"}}>
        <WalletConnectPanel/>
        { sessionToken 
          ? 
            PanelAuthenticated()
          : 
            PanelMetamaskLogin({url: DDC_GATEWAY, login: onLoginPressed})
        }
      </Stack>
    </div>
  );

  return <MainPanel/>;
};


const MetamaskLogout = ({logout, address}) => (
    <Container>
      <Button variant="outline-secondary" onClick={logout}> Logout </Button>
    </Container>
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


const PanelAttach = () => {
  const [nftId, setNftId] = useState(null);
  const [cid, setCid] = useState(null);
  const [attachOutput, setAttachOutput] = useState("Attachment transaction link:");
  const [status, setStatus] = useState("");

  const onAttachPressed = async () => {
    setAttachOutput("Attaching content to NFT...");
    const { status, tx } = await attachNftToCid(nftId, cid);
    setStatus(status);
    setAttachOutput(<a href={"https://mumbai.polygonscan.com/tx/"+tx}>Transaction Link</a>)
  };


  return (
      <Card bg="secondary" border="secondary" text="light">
        <Card.Header >
          <Card.Title style={{color: "white"}}>Attach</Card.Title>
          <Card.Subtitle className="mb-2">Attach NFT to CID</Card.Subtitle>
        </Card.Header >
        <Card.Body>
          <Container>
            <Row>
              <Col> NFT ID:
              </Col>
              <Col>
                <input type="text" placeholder="NFT ID" onChange={(event) => setNftId(event.target.value)}/>
              </Col>
            </Row>
            <Row>
              <Col> Content ID:
              </Col>
              <Col>
                <input type="text" placeholder="Content ID" onChange={(event) => setCid(event.target.value)}/>
              </Col>
            </Row>
            <Row>
              <Col>
                <Button id="actionButton" onClick={onAttachPressed}> Attach</Button>      
              </Col>
            </Row>
          </Container>    
        </Card.Body>
        <Card.Footer>
        {attachOutput && <Container>
            <Row> 
              <Col >
                 {attachOutput}
              </Col>
            </Row>  
            </Container>
        }
        </Card.Footer>
      </Card>
  );
};