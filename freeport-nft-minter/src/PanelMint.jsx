import { React, useState } from "react";
import { mintNFT } from "./actions.js";

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

const PanelMint = () => {
  const [qty, setQty] = useState(1);
  const [mintOutput, setMintOutput] = useState("");
  const [metadata] = useState("0");

  const onMintPressed = async () => {
    setMintOutput("Creating NFT...");
    const { nftId } = await mintNFT(+qty, metadata)
    setMintOutput("NFT ID: " + nftId);
  };

  return (
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
  );
};

export default PanelMint;