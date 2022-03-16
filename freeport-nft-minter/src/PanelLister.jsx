import { useState, useCallback } from "react";

import { get as httpGet } from "axios";
import { importProvider } from "@cere/freeport-sdk";
import {
    utilProvider2Ethereum,
    utilGetAccounts,
    utilGetOwnerAddress,
} from "./util";
import Button from 'react-bootstrap/Button';

import { API_GATEWAY } from "./config";

const TokenList =  ({env}) => {
	const [ownedList, setOwnedList] = useState(null);
	const getList = useCallback(async () => {
		const owned = await listTokens(env);
		// console.log({minted, owned});
		//setMintedList(minted);
		setOwnedList(owned);
	});
	return (
		<div className="Minter">
			<h2> Token List </h2>
			<Button  id="actionButton" onClick={getList}> List My Tokens </Button>

			{ ownedList ? (TokenListTable({ownedList})) : null}

		</div>
	);
};

const TokenListTable = ({ownedList}) => (
	<table border="1">
		<thead>
			<tr>
				<td> Quantity </td>
				<td> ID </td>
			</tr>
		</thead>
		<tbody>
			{ownedList.map((token,i) => (
				<tr key={i}>
					<td> {token.quantity} / {token.supply} </td>
					<td> {token.nftId} </td>
				</tr>
			))}
		</tbody>
	</table>
);


const listOwnedUrl = (urlBase) => (wallet) => `${urlBase}/wallet/${wallet}/nfts/minted`;

export const listTokens = async (env) => {
    const provider = importProvider();
    const ethereum = utilProvider2Ethereum(provider);
    const accounts = await utilGetAccounts(ethereum);
    const minter = await utilGetOwnerAddress(ethereum, accounts);

    const url = listOwnedUrl(API_GATEWAY)(minter);
    const resp = await httpGet(url);
    return resp.data;
};


export default TokenList;
