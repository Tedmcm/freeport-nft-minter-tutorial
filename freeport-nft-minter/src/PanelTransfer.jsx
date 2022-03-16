import { useState } from "react";
import {
    importProvider,
    createFreeport,
    getFreeportAddress
} from "@cere/freeport-sdk";

import { transferNFT } from "./actions";

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const PanelTransfer = ({ env, walletAddress }) => {
  const [tx, setTx] = useState(null);
  const [to, setTo] = useState(null);
  const [nftId, setNftId] = useState(null);
  const [error, setError] = useState(null);

  const onToInput = e => setTo(e.target.value);
  const onNftIdInput = e => setNftId(e.target.value);

  const submit = async () => {
    try {
      setError(null);
      setTx(null);
    	const tx = await transferNFT(walletAddress, to, nftId);
    	setTx(tx.hash);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
      <Card bg="secondary" border="secondary" text="light">
      	<Card.Header> 
      		<Card.Title> Transfer Token </Card.Title>
      	</Card.Header>
      	<Card.Body>

	      <Row>
	        <Col> To Wallet: </Col>
	        <Col> 
	        	<input placeholder="To Address" value={to} onChange={onToInput}/>
	      	</Col>
	      </Row>
	      <Row>
	        <Col> NFT ID: </Col>
	        <Col> 
	        	<input placeholder="nftId" value={nftId} onChange={onNftIdInput}/>
	      	</Col>
	      </Row>
	      <Button id="actionButton" onClick={submit}> Transfer </Button>
   	    </Card.Body>
        <Card.Footer>
    	  { tx ? <TxLink url={makeScanUrl(tx)}/> : null}
        { error ? <div> {(error)} </div> : null}
   	    </Card.Footer>
   	  </Card>
  );
};

const TxLink = ({url}) => (
  <a
    href={url}
    target={"txscanner"}>
    Transaction Link
  </a>
);


const makeScanUrl = (tx) => `https://mumbai.polygonscan.com/tx/${tx}`;

export default PanelTransfer;
