# Cere Freeport/DDC Technical Overview

Cere Freeport is Cere's NFT minting and asset management solution with the following features:

-   Smart contracts for minting
-   Secure asset storage in DDC
-   Configure pricing, roylaty and auction parameters

## Components

The core functionality of Cere Freeport is provided by the Freeport smart contracts and the DDC. However, there are several other components that make developer experience simpler and efficient.

The following diagram shows the various components of the Freeport system:

![Architecture](architecture.jpg)

`TODO` - Add all services plus cleanup the diagram

-   (`TODO` Add to diagram) Marketplaces: Primary and secondary marketplaces (similar to Cere's DaVinci, Open Sea) with front-end marketing infrastrcture to help users create, discover, sell and trade digital assets.
-   Freeport Smart contracts: The smart contracts provide the onchain functionality to mint, configure and transact multi-asset, potentially multi-owner NFTs. 
-   SC Client SDK: This is a Javascript SDK useful for interaction with the smart contracts from Web UI appications and nodejs-based services.
-   Creator suite: Web UI application for accessing Freeport functionality
-   DDC Proxy: A utility service that makes it easy to encrypt and store big blobs of data in the DDC.
-   DDC: Cere Decentralized Data Cloud, an SLA-backed storage system optimized for NFT and media storage and streams of application events such as gaming events.  The Decenralized design of the system allows anyone to run the nodes that form the DDC and get paid for the services.
-   Freeport Cloud Services
    -   Freeport DB: A database containing historical smart contract changes to help applications provide faster access to historical data such as provenance, ownership transfer, sales etc.
    -   Freeport API Service: A read-only API to access the Freeport DB.
    -   (`TODO` Add to diagram) Freeport Creator Suite: Frontend application that supports NFT marketplaces. It uses the Freeport Smart contracts and services infrastructure to:
        - Create NFTs
        - Setup royalty payment structures
        - Generate interstitial ads on social media
    -   (`TODO` Add to diagram) Creator Content Management System (CMS): A headless content management system that allows editing and management of 
        Creator and NFT information to be used by marketplaces.
    -   Smart contract event listener: A cloud service that monitors onchain events and updates DDC meta data and Freeport DB.


# NFT Creation

NFT creation with Freeport involves the following steps:

1. Creating assets in the DDC: This step involves storing the content data inside the DDC, 
   using either the direct DDC interface, or going through a utility service called `DDC Proxy` 
   which simplifies the process or breaking up the content into chunks, encrypting and storing them in the DDC.
2. Minting NFT: Minting an NFT token is a straightforward process of invoking `issue()` function 
   on the Freeport NFT contract. This is a standard ERC1155 contract that assigns an NFT ID to your token.
3. Attaching one or more assets with the token: NFT tokens in Freeport ecosystem 
   contain direct references to the assets unlike many other systems. One or more Content IDs (CID) 
   are attached to tokens. This is supported by the `NFTAttachment` contract.
4. Configuration of royalties, pricing, auction parameters etc.  Once a token is created, Freeport smart 
   contracts can be used to define the following, onchain:
   - Joint accounts: Freeport smart contracts allow specification of how any payments to a creator are to be split. 
     For example, an artist may work with an agent to market their work, and decide to pay a percentage 
     of their income to the agent. Joint accounts allow specification of this split.
   - Auction parameters: A creator may choose to auction an asset, and may specify minimum bid
     price, auction start/end dates etc parameters.
   - Royalty structure: The royalty contract may be used to specify that a percentage of every transaction 
     amount be paid to the creator account, potentially a joint account.  A different percentage may be specified 
     for direct sales and secondary sales.

# How It works

## NFT Transactions

NFT sales are supported by `Exchange` and `Auction` smart contracts, designed for use by marketplaces. When a sale or trade happens, 
these contracts invoke transfer functions of the NFT contracts (ERC1155).

The Freeport smart contracts publish onchain events when significant events occur, such as minting, transfer etc. 
These events are monitored by a cloud service called `SC Event Listener`. This service:
  - updates the DDC to track provenance and history of digital assets and
  - stores historical information in a database (`Freeport DB`) to support fast access 
    to data for enchanced user experience in marketplaces.

## Uploading & Downloading Content

Upload/download of NFT content is done using an access service called 
`Freeport DDC Proxy`. This proxy provides a simplified API to access 
the underlying DDC services. 

For custom functionality to mint NFTs, such as batch jobs, DDC provides a
`DDC Connector` SDK. This SDK provides a Kafka connector to stream data to
the DDC. Additional connectors for using Message queuing systems such as 
Amazon SQS are in the pipeline.

## Hosting Smart Contracts on Own Chain

The Cere Freeport Smart contracts are open source and maybe hosted by any 
EVM-compatible chain. However, for effective integration with a gaming or 
metaverse system, the cloud services described above, are required. These 
services may be hosted by you in your own network or run by Cere for you. 
Please contact the Cere Ecosystem team 
for guidance on implementation.

## Running own DDC Nodes

Cere encourages its ecosystem partners to participate in decentralization of 
the DDC network. In addition to helping adoption of DDC and its ethos, running 
DDC nodes would offer the following benefits to ecosystem partners:

  - Ensure safety and security of your data
  - Additional reveneues for providing the service
  - Faster access with lower latency by running custom services closer to the nodes

`TODO` - describe what it takes to run a node. E.g. Tokens, running blockchain nodes (??), staking etc.

# References

  - [Cere Freeport Github](https://github.com/Cerebellum-Network/Cere-Freeport)
  - [Freeport Smart contract Listener Github](https://github.com/Cerebellum-Network/freeport-sc-event-listener)
  - [DDC Node and CLI Documentation](https://cere-network.gitbook.io/cere-network/)
  - [NFT Minting Tutorial](https://github.com/Cerebellum-Network/freeport-nft-minter-tutorial)
