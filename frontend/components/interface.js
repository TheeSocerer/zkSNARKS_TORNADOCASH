import { useState } from "react";
import $u from '../utils/$u.js';
import { ethers } from "ethers";

import wc from "../circuit/witness_calculator.js";

// const tornadoAddress = "";

// const tornadoJSON = require("../json/Tornado.json");
// const tornadoABI = tornadoJSON.abi;
// const tornadoInterface = new ethers.utils.Interface(tornadoABI);

// const ButtonState = { Normal: 0, Loading: 1, Disabled: 2 };

const Interface = () => {
    const [account, updateAccount] = useState(null);
    // const [proofElements, updateProofElements] = useState(null);
    // const [proofStringEl, updateProofStringEl] = useState(null);
    // const [textArea, updateTextArea] = useState(null);

    // interface states
    

    const connectMetamask = async () => {
        try{
            if(!window.ethereum){
                alert("Please install Metamask to use this app.");
                throw "no-metamask";
            }

            var accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
            var chainId = window.ethereum.networkVersion;

            if(chainId != "11155111"){
                alert("Please switch to Goerli Testnet");
                throw "wrong-chain";
            }

            var activeAccount = accounts[0];
            var balance = await window.ethereum.request({ method: "eth_getBalance", params: [activeAccount, "latest"] });
            balance = $u.moveDecimalLeft(ethers.BigNumber.from(balance).toString(), 18);

            var newAccountState = {
                chainId: chainId,
                address: activeAccount,
                balance: balance
            };
            updateAccount(newAccountState);
        }catch(e){
            console.log(e);
        }

    };
    
    const depositEther = async () => {
        // updateDepositButtonState(ButtonState.Disabled);

        const secret = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();
        const nullifier = ethers.BigNumber.from(ethers.utils.randomBytes(32)).toString();

        const input = {
            secret: $u.BN256ToBin(secret).split(""),
            nullifier: $u.BN256ToBin(nullifier).split("")
        };

        console.log(input);

        var res = await fetch("/deposit.wasm");
        var buffer = await res.arrayBuffer();
        var depositWC = await wc(buffer);

        const r = await depositWC.calculateWitness(input, 0);
        
        const commitment = r[1];
        const nullifierHash = r[2];


        console.log(commitment)
        console.log(nullifierHash)


        const value = ethers.BigNumber.from("100000000000000000").toHexString();

        const tx = {
            to: tornadoAddress,
            from: account.address,
            value: value,
            data: tornadoInterface.encodeFunctionData("deposit", [commitment])
        };

        // try{
        //     const txHash = await window.ethereum.request({ method: "eth_sendTransaction", params: [tx] });

        //     const proofElements = {
        //         nullifierHash: `${nullifierHash}`,
        //         secret: secret,
        //         nullifier: nullifier,
        //         commitment: `${commitment}`,
        //         txHash: txHash
        //     };

        //     console.log(proofElements);

        //     updateProofElements(btoa(JSON.stringify(proofElements)));
        // }catch(e){
        //     console.log(e);
        // }

        // updateDepositButtonState(ButtonState.Normal);
    };
    
    return (
        <div>

            <nav className="navbar navbar-nav fixed-top bg-dark text-light">
                {
                    !!account ? (
                        <div className="container">
                            <div className="navbar-left">
                                <span><strong>ChainId:</strong></span>
                                <br/>
                                <span>{account.chainId}</span>
                            </div>
                            <div className="navbar-right">
                                <span><strong>{account.address.slice(0, 12) + "..."}</strong></span>
                                <br/>
                                <span className="small">{account.balance.slice(0, 10) + ((account.balance.length > 10) ? ("...") : (""))} ETH</span>
                            </div>
                        </div>
                    ) : (
                        <div className="container">
                            <div className="navbar-left"><h5>NFTA-Tornado</h5></div>
                            <div className="navbar-right">
                                <button 
                                    className="btn btn-primary" 
                                    onClick={connectMetamask}
                                >Connect Metamask</button>
                            </div>
                        </div>
                    )
                }

                
            </nav>

            <div style={{ height: "60px" }}></div>
            
            <button onClick={depositEther}>Deposit</button>

           
        </div>
    )
};

export default Interface;