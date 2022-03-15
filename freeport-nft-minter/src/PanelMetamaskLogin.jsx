import { React, } from "react";

import Button from 'react-bootstrap/Button';
import Card from 'react-bootstrap/Card';

const PanelMetamaskLogin = ({login}) => (
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

export default PanelMetamaskLogin;