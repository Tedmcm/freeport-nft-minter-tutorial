import { useState } from "react";
import {
    importProvider,
    createFreeport,
    getFreeportAddress
} from "@cere/freeport-sdk";

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const TransferView = () => {
  const [tx, setTx] = useState(null);
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [nftId, setNftId] = useState(null);

  const onFromInput = e => setFrom(e.target.value);
  const onToInput = e => setTo(e.target.value);
  const onNftIdInput = e => setNftId(e.target.value);

  const submit = async () => {
  	const tx = await transfer(to, nftId);
  	setTx(tx.hash);
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




export const transfer = async (to, nftId) => {
    const provider = importProvider();
    const env = "prod";
    debugger
    const contractAddress = await getFreeportAddress(provider, env);

    // Contract object
    const contract = createFreeport({
        provider,
        contractAddress
    });

    // find from address
    const accounts = await provider.provider.request({ method: 'eth_requestAccounts' });
    const from = accounts[0];


    const tx = await contract.safeTransferFrom(from, to, nftId, 1, [0]);
    const receipt = await tx.wait();
    console.log(receipt);

    return tx;
};

const makeScanUrl = (tx) => `https://mumbai.polygonscan.com/tx/${tx}`;

export default TransferView;
