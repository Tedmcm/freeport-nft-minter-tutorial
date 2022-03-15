import { React, useState } from "react";
import { downloadFromDDC } from "./actions.js";

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import {DDC_GATEWAY} from "./config";

const PanelDownload = ({provider, minter, sessionToken}) => {
  const [cid, setCid] = useState(null);
  const [downloadedImage, setDownloadedImage] = useState(null);

  const onDownloadPressed = async () => {
    setDownloadedImage(null);
    const { status, content} = await downloadFromDDC(DDC_GATEWAY, sessionToken, provider, minter, cid);
    setDownloadedImage(URL.createObjectURL(content));
  };

  return (
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
  );
};


export default PanelDownload;