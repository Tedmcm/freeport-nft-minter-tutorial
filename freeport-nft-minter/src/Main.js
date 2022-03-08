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

import { importProvider, } from "@cere/freeport-sdk";
import {
    utilProvider2Ethereum,
    utilGetAccounts,
    utilGetOwnerAddress,
    utilGetEncPubKey,
    utilSign,
} from "./util";

const DDC_GATEWAY = "https://ddc.freeport.dev.cere.network";


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
  const [metadata, setMetadata] = useState("0");
  const [qty, setQty] = useState(1);
  const [nftId, setNftId] = useState(null);
  // State variables - Statuses
  const [status, setStatus] = useState("");
  const [uploadOutput, setUploadOutput] = useState("Content ID:");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [mintOutput, setMintOutput] = useState("");
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
    setCid(null);
    try {
      setUploadOutput("Uploading...");
      setPreviewUrl(null);
      setCid(null);
      const { contentId, previewUrl, status } = await upload2DDC(
          DDC_GATEWAY, /* Server Address */ 
          sessionToken, /* Session token */
          minter,  /* User wallet */
          minterEncryptionKey,  /* User's public encryption key */
          uploadData, /* main image file to upload */
          previewData, /* Preview image file */
          uploadDataTitle, /* Human readable title */
          uploadDataDescription /* Human readable description of this data */
      );
      setStatus(status);
      setPreviewUrl(previewUrl);
      setCid(contentId);
      setUploadOutput("Content ID: " + contentId);
    } catch (error) {
      setUploadOutput("" + error);
    }
  }

  const onDownloadPressed = async () => {
    setDownloadedImage(null);
    const { status, content} = await downloadFromDDC(DDC_GATEWAY, sessionToken, provider, minter, cid);
    setStatus(status);
    setDownloadedImage(URL.createObjectURL(content));
  };

  const onMintPressed = async () => {
    const { tx, nftId, status } = await mintNFT(+qty, metadata)
    setStatus(status);
    setMintOutput("NFT ID: " + nftId);
  };


  const onAttachPressed = async () => {
    setAttachOutput("Attaching content to NFT...");
    const { status, tx } = await attachNftToCid(nftId, cid);
    setStatus(status);
    setAttachOutput(<a href={"https://mumbai.polygonscan.com/tx/"+tx}>Transaction Link</a>)
  };

  const onClearOutputPressed = async () => {
    setStatus("Follow the steps below.");
    setUploadData(null);
    setPreview(null);
    setUploadOutput(null)
    setMintOutput(null)
    setAttachOutput(null)
  };
  const login = async () => {
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
    <Container fluid="md" bg="dark">
      <Row >
        <Col className="col-10"/>
        <Col>
          <MetamaskLogout address={minter} logout={logout}/>
        </Col>
      </Row>
      <Row lg={2} md="auto" className="g-4">
      <Col >
        <Card  bg="secondary" border="secondary" text="light">
          <Card.Header >
              <Card.Title>Upload</Card.Title>
              <Card.Subtitle className="mb-2">Upload your content to DDC </Card.Subtitle>
          </Card.Header>
          <Card.Body>
              <form className="form" id="myform">
              <Container>
                <Row lg={3} md={3}> 
                  <Col >Main image: </Col>
                  <Col>
                   <input name="file" type="file" onChange={(event) => { setUploadData(event.target.files[0]); setPreviewMain(URL.createObjectURL(event.target.files[0])); }}></input>
                  </Col>
                  <Col>{ previewMain && <img alt="main image" src={previewMain} style={{width: "32px"}}></img>}</Col>
                </Row> 

                <Row lg={3} md={3}> 
                  <Col >Preview image: </Col>
                  <Col>
                   <input name="preview" type="file" onChange={(event) => {setPreviewData(event.target.files[0]); setPreview(URL.createObjectURL(event.target.files[0])); }}></input>
                  </Col>
                  <Col>{ previewMain && 
                    <img alt="preview image" src={preview} style={{width: "32px"}}></img>
                  }</Col>
                </Row> 
                <Row lg={3} md={3}> 
                  <Col >
                  <span >Title:</span>
                  </Col>
                  <Col>
                    <input type="text" placeholder="Content title" value={uploadDataTitle} onChange={(event) => setUploadDataTitle(event.target.value)}/>
                  </Col>
                </Row> 
                <Row lg={3} md={3}> 
                  <Col >
                   <span >Description:</span>
                  </Col>
                  <Col>
                    <input type="text" placeholder="Content description" value={uploadDataDescription} onChange={(event) => setUploadDataDescription(event.target.value)}/>
                  </Col>
                </Row> 
                <Row lg={3} md={3}> 
                  <Col>
                  </Col>
                  <Col>
                      <Button id="actionButton" onClick={onUploadPressed}> Upload </Button>
                  </Col>
                  <Col>
                  </Col>
                </Row>
              </Container>
              </form>

          </Card.Body>
          <Card.Footer>
            { uploadOutput && <Container>
              <Row > 
                <Col >
                  {uploadOutput}
                </Col>
              </Row>
              <Row > 
                <Col>
                  { previewUrl && <a href={previewUrl}> Preview Link </a>   }  
                </Col>
              </Row>
            </Container>}
          </Card.Footer>          
        </Card>
      </Col>
      <Col>
        <Card  bg="secondary" border="secondary" text="light">
          <Card.Header >
            <Card.Title >Download </Card.Title>
            <Card.Subtitle className="mb-2">Verify that your content was uploaded by downloading it from DDC</Card.Subtitle>
          </Card.Header >
          <Card.Body>
            <Container>
              <Row> 
                <Col>
                  Content ID:
                </Col>  
                <Col >
                  <input type="text" placeholder="Content ID from upload step." onChange={(event) => setCid(event.target.value)}/>
                </Col>
              </Row>  

              <Row > 
                <Col >
                  <Button id="actionButton" onClick={onDownloadPressed}> Download </Button>      
                </Col>
              </Row>  
            </Container>
          </Card.Body>

          <Card.Footer>
              {downloadedImage && <Container>
              <Row lg={2} md={2}> 
                <Col >
                  Downloaded image:
                </Col>  
                <Col >
                   <img src={downloadedImage} style={{width: "64px"}}></img>
                </Col>
              </Row>  
              </Container>}
          </Card.Footer>

        </Card>
      </Col>
      <Col>
        <Card  bg="secondary" border="secondary" text="light">
          <Card.Header >
            <Card.Title style={{color: "white"}}>Mint</Card.Title>
            <Card.Subtitle className="mb-2">Create your NFT (ERC 1155) on Polygon</Card.Subtitle>
          </Card.Header >
          <Card.Body>
            <Container>
              <Row>
                <Col> Supply:
                </Col>
                <Col>
                  <input type="number" placeholder="Number of copies to mint" value={qty} onChange={(event) => setQty(event.target.value)}/>
                </Col>
              </Row>
              <Row>
                <Col>
                  <Button id="actionButton" onClick={onMintPressed}> Mint NFT</Button>      
                </Col>
              </Row>
            </Container>    
          </Card.Body>
          <Card.Footer>
          {mintOutput && <Container>
              <Row> 
                <Col >
                   {mintOutput}
                </Col>
              </Row>  
              </Container>
          }
          </Card.Footer>
        </Card>
      </Col>
      <Col>
        <Card  bg="secondary" border="secondary" text="light">
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
      </Col>
    </Row>
    </Container>
    );


  return (   
    <div style={{backgroundColor:"black"}}>
      <button id="walletButton" onClick={connectWalletPressed}>
        {walletAddress.length > 0 ? ("Connected: " + String(walletAddress).substring(0, 6) + "..." + String(walletAddress).substring(38)) : (<span>Connect Wallet</span>)}
      </button>

      { sessionToken && 
      <Fragment>
      <h1 style={{color:"white"}}> Create an NFT with Cere Freeport and DDC </h1>

      {/*
      <Container fluid="md">
        <Row>
        <Card  bg="dark" border="secondary">
          <Card.Body>
            <Card.Title style={{color: "white"}}>Status</Card.Title>
            <Card.Subtitle className="mb-2 text-muted">Output Messages</Card.Subtitle>

            <div className="header">
              <h3>Status message:</h3>
              <p id="status"> {status} </p>
            </div>

            <div className="header2">
              <h3>Outputs:</h3>
              <div> {uploadOutput} </div>
              <div> {mintOutput} </div>
              <div> {attachOutput} </div>
            </div>
          <Button id="actionButton" onClick={onClearOutputPressed}>Clear output</Button>   
          </Card.Body>
        </Card>
        </Row>
      </Container>
    */}
      </Fragment>
      }
      
      { sessionToken ? AuthenticatedView() : MetamaskLogin({url: DDC_GATEWAY, login: login})
      } 


    </div>
  );
};


const MetamaskLogin = ({login}) => (
<div className="login-container">
  <div class="vertical-center">
      <Card bg="secondary" border="secondary">
        <Card.Header>
          <Card.Title>Login</Card.Title>
          <Card.Subtitle className="mb-2 ">Login with Metamask</Card.Subtitle>
        </Card.Header>
        <Card.Body>
          <Card.Text>
            Logging in with Metamask allows you to setup a session with the DDC Gateway to minimize wallet 
            (e.g. metamask) interactions. The Gateway caches the encryption key and significantly improves 
            usability when you upload files multiple times (e.g. drag and drop scenarios)
          </Card.Text>  
          <Button onClick={login}> Login </Button>
        </Card.Body>
      </Card>
  </div>
</div>
);
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
