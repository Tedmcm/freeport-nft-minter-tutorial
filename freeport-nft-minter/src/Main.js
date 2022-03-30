import { React, useEffect, useState, useContext, Fragment } from "react";
import { connectWallet, getCurrentWalletConnected, upload2DDC, downloadFromDDC } from "./actions.js";

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


import { importProvider } from "@cere/freeport-sdk";

import {
  utilProvider2Ethereum,
  utilGetAccounts,
  utilGetOwnerAddress,
  utilGetEncPubKey,
  utilSign,
} from "./util";

import { API_ENV, DDC_GATEWAY, API_GATEWAY } from "./config";

const Main = (props) => {
  // State variables - Connecting wallet
  const [walletAddress, setWalletAddress] = useState("");

  // State variables 
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);


  const [sessionToken, setSessionToken] = useState(null);
  const [downer, setDowner] = useState(null);
  const [downerEncryptionKey, setDownerEncryptionKey] = useState(null);
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
    const { address, status } = await getCurrentWalletConnected();
    setWalletAddress(address)
    setStatus(status);
    addWalletListener();
    // The 'dependencies' array
  }, []);



  const onLoginPressed = async () => {
    const provider = importProvider();
    const ethereum = utilProvider2Ethereum(provider);
    const accounts = await utilGetAccounts(ethereum);
    const downer = await utilGetOwnerAddress(ethereum, accounts);
    const downerEncryptionKey = await utilGetEncPubKey(ethereum, accounts);

    const url = DDC_GATEWAY;

    const nonce = await getNonce(downer, url);
    const sessionToken = await authorize(url, provider, downer, downerEncryptionKey, nonce);

    LocalStorage.set('downer', downer);
    LocalStorage.set('downerEncryptionKey', downerEncryptionKey);
    LocalStorage.set('sessionToken', sessionToken);

    setDowner(downer);
    setDownerEncryptionKey(downerEncryptionKey);
    setProvider(provider);
    setSessionToken(sessionToken);
  };

  const onLogoutPressed = () => {
    setDowner(null);
    setDownerEncryptionKey(null);
    setProvider(null);
    setSessionToken(null);
    LocalStorage.set('downer', null);
    LocalStorage.set('downerEncryptionKey', null);
    LocalStorage.set('sessionToken', null);
  };

  // read from local storage
  useEffect(() => {

    const downer = LocalStorage.get('downer');
    const downerEncryptionKey = LocalStorage.get('downerEncryptionKey');
    const sessionToken = LocalStorage.get('sessionToken');

    setDowner(downer);
    setDownerEncryptionKey(downerEncryptionKey);
    setSessionToken(sessionToken);
  })


  const PanelAuthenticated = () => (
    <div>
      <h1 style={{ color: "white" }}> Upload and download your files into Cere DDC </h1>
      <Container fluid="md" bg="dark">
        <Row>
          <Col className="col-10" />
          <Col>
            <MetamaskLogout address={downer} logout={onLogoutPressed} />
          </Col>
        </Row>
        <Row lg={2} md={2} className="g-4">
          <Col >
            <PanelUpload
              downer={downer}
              sessionToken={sessionToken}
              downerEncryptionKey={downerEncryptionKey} />
          </Col>
          <Col>
            <PanelDownload
              provider={provider}
              downer={downer}
              sessionToken={sessionToken}
            />
          </Col>
        </Row>
      </Container>
    </div>
  );

  const WalletConnectPanel = () => (
    <div style={{ float: "right" }}>
      <span style={{ color: "white", float: "right" }}> Using {API_ENV} environment </span>
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
    <div style={{ backgroundColor: "black" }}>
      <Stack style={{ color: "white" }}>
        <WalletConnectPanel />
        {sessionToken
          ?
          PanelAuthenticated()
          :
          PanelMetamaskLogin({ url: DDC_GATEWAY, login: onLoginPressed })
        }
      </Stack>
    </div>
  );

  return <MainPanel />;
};


const MetamaskLogout = ({ logout, address }) => (
  <Container>
    <Button variant="outline-secondary" onClick={logout}> Logout </Button>
  </Container>
);

// Authorize
const authorize = async (baseUrl, provider, downer, encryptionPublicKey, nonce) => {
  const msgToSign = `${downer}${encryptionPublicKey}${nonce}`;
  const signature = await utilSign(provider, downer, msgToSign);
  const authUrl = `${baseUrl}/auth/v1/${downer}`;
  const result = await httpPost(authUrl, { encryptionPublicKey, signature });
  console.log("Auth result", result.data);
  const token = result.data.accessToken;
  return token;
};

// Get NONCE for session
const getNonce = async (downer, baseUrl) => {
  const result = await httpGet(`${baseUrl}/auth/v1/${downer}/nonce`);
  console.log("NONCE is", result.data);
  return result.data;
};


export default Main;


const txUrl = (tx) => "https://mumbai.polygonscan.com/tx/" + tx;


const TxLink = ({ url }) => (
  <a
    href={url}
    target={"txscanner"}>
    Transaction Link
  </a>
);
