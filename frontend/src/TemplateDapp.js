import React, { useState } from "react";
import { ethers } from "ethers";
import TemplateJson from "./contracts/Template.json";

const CONTRACT_ADDRESS = ""; // Set deployed contract address here

export default function TemplateDapp() {
  const [provider, setProvider] = useState();
  const [signer, setSigner] = useState();
  const [contract, setContract] = useState();
  const [value, setValue] = useState();
  const [input, setInput] = useState("");
  const [owner, setOwner] = useState("");
  const [account, setAccount] = useState("");

  async function connectWallet() {
    if (window.ethereum) {
      const prov = new ethers.BrowserProvider(window.ethereum);
      await prov.send("eth_requestAccounts", []);
      const signer = await prov.getSigner();
      setProvider(prov);
      setSigner(signer);
      setAccount(await signer.getAddress());
      const contract = new ethers.Contract(CONTRACT_ADDRESS, TemplateJson.abi, signer);
      setContract(contract);
      setOwner(await contract.owner());
      setValue((await contract.value()).toString());
    } else {
      alert("Please install MetaMask!");
    }
  }

  async function updateValue() {
    if (!contract) return;
    const tx = await contract.setValue(input);
    await tx.wait();
    setValue((await contract.value()).toString());
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Template DApp</h2>
      {!account ? (
        <button onClick={connectWallet}>Connect Wallet</button>
      ) : (
        <div>
          <div>Connected as: {account}</div>
          <div>Owner: {owner}</div>
          <div>Current Value: {value}</div>
          <input
            type="number"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="New value"
          />
          <button onClick={updateValue} disabled={account !== owner}>
            Set Value
          </button>
        </div>
      )}
    </div>
  );
}
