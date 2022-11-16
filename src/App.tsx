import { UniPassPopupSDK } from "@unipasswallet/popup-sdk";
import {
  UniPassTheme,
  UPAccount,
  UPEvent,
  UPEventType,
} from "@unipasswallet/popup-types";
import { Interface, parseEther } from "ethers/lib/utils";
import { memo, useState } from "react";
import styled from "styled-components";
import "./App.css";

const HeadWarp = styled.div`
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 20px;
  background-color: lightgray;
  button {
    cursor: pointer;
  }
`;
const Account = styled.div`
  display: flex;
  gap: 8px;
`;
const TransfetWrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-left: 500px;
`;
const SubmitBtn = styled.div`
  width: 120px;
  height: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: lightgreen;
  cursor: pointer;
`;

export const upWallet = new UniPassPopupSDK({
  env: "test",
  // for polygon mumbai
  chainType: "polygon",
  nodeRPC: "https://node.wallet.unipass.id/polygon-mumbai",

  appSettings: {
    chain: "polygon",
    theme: UniPassTheme.LIGHT,
    appName: "UniPass Wallet Demo",
    appIcon: "",
  },
  walletUrl: {
    domain: "testnet.wallet.unipass.id",
    protocol: "https",
  },
});
function App() {
  const [account, setAccount] = useState<UPAccount>();

  const Header = memo(() => {
    const handleConnet = async () => {
      try {
        const account = await upWallet.login({
          email: true,
          eventListener: (event: UPEvent) => {
            console.log("event", event);
            const { type, body } = event;
            if (type === UPEventType.REGISTER) {
              console.log("account", body);
            }
          },
          connectType: "both",
        });
        const { address, email } = account;
        console.log("account", address, email);
        setAccount({ address, email });
      } catch (err) {
        console.log("connect err", err);
      }
    };
    const handleLogout = async () => {
      await upWallet.logout();
      setAccount({} as UPAccount);
    };
    return (
      <HeadWarp>
        {account?.address ? (
          <Account>
            <span>{account?.email}</span>
            <span>{account?.address}</span>
          </Account>
        ) : null}
        {account?.address ? (
          <button onClick={handleLogout}>Log out</button>
        ) : (
          <button onClick={handleConnet}>Connet Wallet</button>
        )}
      </HeadWarp>
    );
  });
  const Transfer = memo(() => {
    const [toAddress, setToAddress] = useState("");
    const [amount, setAmount] = useState("");
    const [toAddress2, setToAddress2] = useState("");
    const [amount2, setAmount2] = useState("");

    const checkTxStatus = async (txHash: string) => {
      let tryTimes = 0;
      while (tryTimes++ < 3) {
        const receipt = await upWallet
          .getProvider()
          .getTransactionReceipt(txHash);
        if (receipt) return receipt.status;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      return false;
    };
    const handelSubmit = async () => {
      try {
        const tx = {
          from: account?.address as string,
          to: toAddress,
          value: parseEther(amount).toHexString(),
          data: "0x",
        };
        const txHash = await upWallet.sendTransaction(tx);
        if (await checkTxStatus(txHash)) {
          console.log("send Native Token success", txHash);
        } else {
          console.error(`send Native Token failed, tx hash = ${txHash}`);
        }
      } catch (err) {
        console.log("err", err);
      }
    };
    const handelSubmitERC20 = async () => {
      try {
        const tokenAddress = "0xce38a49eBf99c9272b4BC37A53357D81bc0f3b88";
        const data = new Interface([
          "function transfer(address _to, uint256 _value)",
        ]).encodeFunctionData("transfer", [toAddress2, amount2]);
        console.log(
          "🚀 ~ file: App.tsx ~ line 145 ~ handelSubmitERC20 ~ data",
          data
        );
        const tx = {
          from: account?.address as string,
          to: toAddress2,
          value: "0x0",
          data: data,
        };
        const txHash = await upWallet.sendTransaction(tx);
        if (await checkTxStatus(txHash)) {
          console.log("send Token success", txHash);
        } else {
          console.error(`send Token failed, tx hash = ${txHash}`);
        }
      } catch (err) {
        console.log("err", err);
      }
    };

    return (
      <>
        <TransfetWrap>
          <h3>Transfer Native Token: </h3>
          <div>
            toAddress:{" "}
            <input
              onChange={(e) => {
                setToAddress(e.target.value);
              }}
            />
          </div>
          <div>
            amount:{" "}
            <input
              onChange={(e) => {
                setAmount(e.target.value);
              }}
            />
          </div>
          <SubmitBtn onClick={handelSubmit}>submit</SubmitBtn>
        </TransfetWrap>
        <TransfetWrap>
          <h3>Transfer ERC20 Token: </h3>
          <div>
            toAddress:{" "}
            <input
              onChange={(e) => {
                setToAddress2(e.target.value);
              }}
            />
          </div>
          <div>
            amount:{" "}
            <input
              onChange={(e) => {
                setAmount2(e.target.value);
              }}
            />
          </div>
          <SubmitBtn onClick={handelSubmitERC20}>submit</SubmitBtn>
        </TransfetWrap>
      </>
    );
  });
  return (
    <div className="App">
      <Header />
      {account?.address && <Transfer />}
    </div>
  );
}

export default App;
