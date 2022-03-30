import { React, useState } from "react";

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import { DDC_GATEWAY } from "./config";

import { upload2DDC } from "./actions.js";

const PanelUpload = ({ downer, downerEncryptionKey, sessionToken }) => {
  const [uploadData, setUploadData] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [uploadDataTitle, setUploadDataTitle] = useState("")
  const [uploadDataDescription, setUploadDataDescription] = useState("")
  // State variables - Download content
  const [preview, setPreview] = useState(null);
  const [previewMain, setPreviewMain] = useState(null);
  const [uploadOutput, setUploadOutput] = useState("Content ID:");
  const [status, setStatus] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  const onUploadPressed = async () => {
    try {
      setUploadOutput("Uploading...");
      setPreviewUrl(null);
      const { contentId, previewUrl, status } = await upload2DDC(
        DDC_GATEWAY, /* Server Address */
        sessionToken, /* Session token */
        downer,  /* User wallet */
        downerEncryptionKey,  /* User's public encryption key */
        uploadData, /* main image file to upload */
        previewData, /* Preview image file */
        uploadDataTitle, /* Human readable title */
        uploadDataDescription /* Human readable description of this data */
      );
      setStatus(status);
      setPreviewUrl(previewUrl);
      setUploadOutput("Content ID: " + contentId);
    } catch (error) {
      setUploadOutput("" + error);
    }
  }

  return (
    <Card bg="secondary" border="secondary" text="light">
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
              <Col>{previewMain && <img alt="main image" src={previewMain} style={{ width: "32px" }}></img>}</Col>
            </Row>

            <Row lg={3} md={3}>
              <Col >Preview image: </Col>
              <Col>
                <input name="preview" type="file" onChange={(event) => { setPreviewData(event.target.files[0]); setPreview(URL.createObjectURL(event.target.files[0])); }}></input>
              </Col>
              <Col>{previewMain &&
                <img alt="preview image" src={preview} style={{ width: "32px" }}></img>
              }</Col>
            </Row>
            <Row lg={3} md={3}>
              <Col >
                <span >Title:</span>
              </Col>
              <Col>
                <input type="text" placeholder="Content title" value={uploadDataTitle} onChange={(event) => setUploadDataTitle(event.target.value)} />
              </Col>
            </Row>
            <Row lg={3} md={3}>
              <Col >
                <span >Description:</span>
              </Col>
              <Col>
                <input type="text" placeholder="Content description" value={uploadDataDescription} onChange={(event) => setUploadDataDescription(event.target.value)} />
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
        {uploadOutput && <Container>
          <Row >
            <Col >
              {uploadOutput}
            </Col>
          </Row>
          <Row >
            <Col>
              {previewUrl && <a href={previewUrl}> Preview Link </a>}
            </Col>
          </Row>
        </Container>}
      </Card.Footer>
    </Card>
  );
};

export default PanelUpload;