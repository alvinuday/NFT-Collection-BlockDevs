import { Contract, providers, utils } from "ethers";
import Image from "next/image";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import { abi, NFT_CONTRACT_ADDRESS } from "../constants";
import imageurl from "../public/3dAsset.webp";
import TextBox from "./components/textBox";

export default function Home() {
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);
  // presaleStarted keeps track of whether the presale has started or not
  const [presaleStarted, setPresaleStarted] = useState(false);
  // presaleEnded keeps track of whether the presale ended
  const [presaleEnded, setPresaleEnded] = useState(false);
  // loading is set to true when we are waiting for a transaction to get mined
  const [loading, setLoading] = useState(false);
  // checks if the currently connected MetaMask wallet is the owner of the contract
  const [isOwner, setIsOwner] = useState(false);
  // tokenIdsMinted keeps track of the number of tokenIds that have been minted
  const [tokenIdsMinted, setTokenIdsMinted] = useState("0");
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();

  /*
      connectWallet: Connects the MetaMask wallet
    */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * presaleMint: Mint an NFT during the presale
   */
  const presaleMint = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the presaleMint from the contract, only whitelisted addresses would be able to mint
      const tx = await whitelistContract.presaleMint({
        // value signifies the cost of one Block dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Block Dev!");
    } catch (err) {
      console.error(err);
    }
  };
  /**
   * publicMint: Mint an NFT after the presale
   */
  const publicMint = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the mint from the contract to mint the Block Dev
      const tx = await whitelistContract.mint({
        // value signifies the cost of one Block dev which is "0.01" eth.
        // We are parsing `0.01` string to ether using the utils library from ethers.js
        value: utils.parseEther("0.01"),
      });
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      window.alert("You successfully minted a Block Dev!");
    } catch (err) {
      console.error(err);
    }
  };
  /**
   * startPresale: starts the presale for the NFT Collection
   */
  const startPresale = async () => {
    try {
      // We need a Signer here since this is a 'write' transaction.
      const signer = await getProviderOrSigner(true);
      // Create a new instance of the Contract with a Signer, which allows
      // update methods
      const whitelistContract = new Contract(NFT_CONTRACT_ADDRESS, abi, signer);
      // call the startPresale from the contract
      const tx = await whitelistContract.startPresale();
      setLoading(true);
      // wait for the transaction to get mined
      await tx.wait();
      setLoading(false);
      // set the presale started to true
      await checkIfPresaleStarted();
    } catch (err) {
      console.error(err);
    }
  };
  /**
   * checkIfPresaleStarted: checks if the presale has started by quering the `presaleStarted`
   * variable in the contract
   */
  const checkIfPresaleStarted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleStarted from the contract
      const _presaleStarted = await nftContract.presaleStarted();
      if (!_presaleStarted) {
        await getOwner();
      }
      setPresaleStarted(_presaleStarted);
      return _presaleStarted;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  /**
   * checkIfPresaleEnded: checks if the presale has ended by quering the `presaleEnded`
   * variable in the contract
   */
  const checkIfPresaleEnded = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the presaleEnded from the contract
      const _presaleEnded = await nftContract.presaleEnded();
      // _presaleEnded is a Big Number, so we are using the lt(less than function) instead of `<`
      // Date.now()/1000 returns the current time in seconds
      // We compare if the _presaleEnded timestamp is less than the current time
      // which means presale has ended
      const hasEnded = _presaleEnded.lt(Math.floor(Date.now() / 1000));
      if (hasEnded) {
        setPresaleEnded(true);
      } else {
        setPresaleEnded(false);
      }
      return hasEnded;
    } catch (err) {
      console.error(err);
      return false;
    }
  };
  /**
   * getOwner: calls the contract to retrieve the owner
   */
  const getOwner = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the owner function from the contract
      const _owner = await nftContract.owner();
      // We will get the signer now to extract the address of the currently connected MetaMask account
      const signer = await getProviderOrSigner(true);
      // Get the address associated to the signer which is connected to  MetaMask
      const address = await signer.getAddress();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
    } catch (err) {
      console.error(err.message);
    }
  };
  /**
   * getTokenIdsMinted: gets the number of tokenIds that have been minted
   */
  const getTokenIdsMinted = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // No need for the Signer here, as we are only reading state from the blockchain
      const provider = await getProviderOrSigner();
      // We connect to the Contract using a Provider, so we will only
      // have read-only access to the Contract
      const nftContract = new Contract(NFT_CONTRACT_ADDRESS, abi, provider);
      // call the tokenIds from the contract
      const _tokenIds = await nftContract.tokenIds();
      //_tokenIds is a `Big Number`. We need to convert the Big Number to a string
      setTokenIdsMinted(_tokenIds.toString());
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();

      // Check if presale has started and ended
      const _presaleStarted = checkIfPresaleStarted();
      if (_presaleStarted) {
        checkIfPresaleEnded();
      }

      getTokenIdsMinted();

      // Set an interval which gets called every 5 seconds to check presale has ended
      const presaleEndedInterval = setInterval(async function () {
        const _presaleStarted = await checkIfPresaleStarted();
        if (_presaleStarted) {
          const _presaleEnded = await checkIfPresaleEnded();
          if (_presaleEnded) {
            clearInterval(presaleEndedInterval);
          }
        }
      }, 5 * 1000);

      // set an interval to get the number of token Ids minted every 5 seconds
      setInterval(async function () {
        await getTokenIdsMinted();
      }, 5 * 1000);
    }
  }, [walletConnected]);

  /*
      renderButton: Returns a button based on the state of the dapp
    */
  const renderButton = () => {
    // If wallet is not connected, return a button which allows them to connect their wllet
    if (!walletConnected) {
      return (
        <button
          onClick={connectWallet}
          className="mx-auto bg-blue-600 px-5 py-4 rounded-md shadow-md hover:opacity-0.8 cursor-pointer text-white"
        >
          Connect your Wallet
        </button>
      );
    }

    // If we are currently waiting for something, return a loading button
    if (loading) {
      return <TextBox text="Loading..." />;
    }

    // If connected user is the owner, and presale hasnt started yet, allow them to start the presale
    if (isOwner && !presaleStarted) {
      return (
        <button
          onClick={startPresale}
          className="mx-auto bg-blue-600 px-5 py-4 rounded-md shadow-md hover:opacity-0.8 cursor-pointer text-white"
        >
          Start Presale
        </button>
      );
    }

    // If connected user is not the owner but presale hasn't started yet, tell them that
    if (!presaleStarted) {
      return <TextBox text="Presale hasn't started yet!" />;
    }

    // If presale started, but hasn't ended yet, allow for minting during the presale period
    if (presaleStarted && !presaleEnded) {
      return (
        <div>
          <TextBox
            text="Presale has started!!! If your address is whitelisted, Mint a Block
            Dev 🥳"
          />
          <button
            onClick={presaleMint}
            className="mx-auto bg-blue-600 px-5 py-4 rounded-md shadow-md hover:opacity-0.8 cursor-pointer text-white"
          >
            Presale Mint 🚀
          </button>
        </div>
      );
    }

    // If presale started and has ended, its time for public minting
    if (presaleStarted && presaleEnded) {
      return (
        <button
          onClick={publicMint}
          className="mx-auto bg-blue-600 px-5 py-4 rounded-md shadow-md hover:opacity-0.8 cursor-pointer text-white"
        >
          Public Mint 🚀
        </button>
      );
    }
  };
  return (
    <div>
      <Head>
        <title>Whitelist DApp</title>
        <meta name="description" content="A Whitelist DApp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="absolute inset-0 my-8 mx-5 rounded-md flex flex-col justify-around md:flex-row md:content-center">
        <div className="flex justify-center">
          <ul className="flex flex-col py-10 content-between text-left justify-center">
            <li className="font-bold text-center text-xl md:text-3xl md:my-10">
              Welcome to Block Devs!
            </li>
            <li className="px-3 my-3 text-lg md:text-xl md:my-0">
              It is an NFT collection for blockchain developers.
            </li>
            <li className="px-3 my-5 text-lg md:text-xl">
              10 already joined the whitelist.
            </li>
            <li className="px-3 flex justify-center md:block">
              <div>{renderButton()}</div>
            </li>
          </ul>
        </div>
        <div className="sm:mx-5 sm:my-5 flex justify-center md:flex-col">
          <Image
            layout="intrinsic"
            width={400}
            height={400}
            src={imageurl}
            // loader={myLoader}
          ></Image>
        </div>
      </div>
      <footer className="absolute bottom-0 bg-slate-300 text-center inset-x-0 text-xl hover:underline cursor-pointer">
        Made with <span className="text-red-600">&hearts;</span> by{" "}
        <a
          className=""
          target="_blank"
          rel="noopener noreferrer"
          href="https://github.com/alvinuday/"
        >
          Weird-AL
        </a>
      </footer>
    </div>
  );
}
