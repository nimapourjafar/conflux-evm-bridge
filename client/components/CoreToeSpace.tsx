// @ts-nocheck
import { useAccount as useEvmAccount } from "@cfxjs/use-wallet-react/ethereum";
import React, { useState } from "react";
import { Conflux, format } from "js-conflux-sdk";
import { addresses } from "../addresses";
import { abi as CFXSideABI } from "../../artifacts/contracts/ConfluxSideERC721.sol/ConfluxSideERC721.json";
import { abi as ERC721Abi } from "../../artifacts/contracts/UpgradeableERC721.sol/UpgradeableERC721.json";
import { useAccount as useCfxAccount } from "@cfxjs/use-wallet-react/conflux/Fluent";

export default function CoreToeSpace({
  setFlipped,
}: {
  setFlipped: (flipped: boolean) => void;
}) {
  const [eSpaceAddress, setESpaceAddress] = useState("");
  const [nftContractAddress, setNftContractAddress] = useState("");
  const [tokenIds, setTokenIds] = useState<string>("");
  const evmAccount = useEvmAccount();
  const cfxAccount = useCfxAccount();

  const sendNfts = async () => {
    const conflux = new Conflux();
    conflux.provider = window.conflux;
    const tokenIdsArray = tokenIds.split(",").map(Number);

    const confluxSideContract = conflux.Contract({
      abi: CFXSideABI,
      address: addresses.ConfluxSide,
    });
    const nftContract = conflux.Contract({
      abi: ERC721Abi,
      address: nftContractAddress,
    });

    // breaks here
    const sourceTokenMapped = await confluxSideContract.sourceTokens(
      nftContractAddress
    );

    const alreadyApproved = await nftContract.isApprovedForAll(
      cfxAccount,
      addresses.ConfluxSide
    );

    if (!alreadyApproved) {
      const approval = await nftContract
        .setApprovalForAll(addresses.ConfluxSide, true)
        .sendTransaction({
          from: cfxAccount,
        });
    }

    if (
      sourceTokenMapped !=
        format.address("0x0000000000000000000000000000000000000000", 1) ||
      sourceTokenMapped !=
        format.address("0x0000000000000000000000000000000000000000")
    ) {
      const formattedSourceTokenMapped = format.hexAddress(sourceTokenMapped);

      const crossTransaction = await confluxSideContract
        .withdrawToEvm(formattedSourceTokenMapped, eSpaceAddress, tokenIdsArray)
        .sendTransaction({
          from: cfxAccount,
        });
    } else {
      const crossTransaction = await confluxSideContract.crossToEvm(
        nftContractAddress,
        eSpaceAddress,
        tokenIdsArray
      );
    }
  };

  return (
    <div className="flex flex-col p-10 rounded-lg shadow-md space-y-2">
      <div className="flex flex-col p-5 border rounded">
        <div className="flex flex-row justify-start">
          <h2>To: Conflux eSpace Test</h2>
          <button onClick={() => setFlipped(true)}>Switch</button>
        </div>
        <div className="flex flex-row">
          <input
            type="text"
            value={eSpaceAddress}
            onChange={(e) => setESpaceAddress(e.target.value)}
            placeholder="eSpace Address"
            className="text-input w-full"
          />
          <button
            onClick={() => {
              if (evmAccount !== undefined) {
                setESpaceAddress(evmAccount);
              }
            }}
          >
            Curr Addr
          </button>
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <input
          type={"text"}
          value={nftContractAddress}
          onChange={(e) => setNftContractAddress(e.target.value)}
          placeholder="NFT Contract Address"
          className="text-input w-full"
        />

        <input
          type={"text"}
          value={tokenIds}
          onChange={(e) => setTokenIds(e.target.value.replace(/[^0-9,]/g, ""))}
          placeholder="Token Ids"
          className="text-input w-full"
        />
      </div>

      <button onClick={sendNfts}>Send NFTs</button>
    </div>
  );
}
