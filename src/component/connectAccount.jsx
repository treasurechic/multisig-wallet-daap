import React, { useEffect, useState } from "react";

//Boostratp components
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";
import Col from "react-bootstrap/Col";
import ListGroup from "react-bootstrap/ListGroup";
import Row from "react-bootstrap/Row";
import Table from "react-bootstrap/Table";

// rainbowKit, ethers and wagmi
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useSigner, useContract, useContractRead } from "wagmi";
import { ethers } from "ethers";

// Contract
import MultisigWallet from "../artifacts/contracts/MultisigWallet.sol/MultisigWallet.json";

export const ConnectAccount = () => {
  const multisigWalletContract = {
    address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    abi: MultisigWallet.abi,
  };

  const [scPendingTransactions, setScPendingTransactions] = useState([]);
  const [ethToUseForDeposit, setEthToUseForDeposit] = useState("");
  const [ethToUseForWithdrawal, setEthToUseForWithdrawal] = useState("");
  const [ethAddrToUseForWithdrawal, setEthAddrToUseForWithdrawal] =
    useState("");

  const { data: signer } = useSigner();
  const contract = useContract({
    ...multisigWalletContract,
    signerOrProvider: signer,
  });

  // Get the list of owners of the multisig
  const { data: scOwners } = useContractRead({
    ...multisigWalletContract,
    functionName: "getOwners",
  });

  // Get smart contract balance
  const { data: scBalance } = useContractRead({
    ...multisigWalletContract,
    functionName: "balanceOf",
    watch: true,
  });

  // Get smart contract withdraw transaction count
  const { data: scTotalTransactionCount } = useContractRead({
    ...multisigWalletContract,
    functionName: "getWithdrawTxCount",
    watch: true,
  });

  //Get Pending withdraw transactions
  const { data: withdrawTxes } = useContractRead({
    ...multisigWalletContract,
    functionName: "getWithdrawTxes",
    watch: true,
  });

  useEffect(() => {
    if (withdrawTxes) {
      let pendingTxes = [];
      for (let i = 0; i <= withdrawTxes.length - 1; i++) {
        if (!withdrawTxes[i][3]) {
          pendingTxes.push({
            transactionIndex: i,
            to: withdrawTxes[i][0],
            amount: parseInt(ethers.utils.formatEther(withdrawTxes[i][1])),
            approvals: withdrawTxes[i][2].toNumber(),
          });
        }
      }
      setScPendingTransactions(pendingTxes);
    }
  }, [withdrawTxes]);

  const depositToEtherWalletContract = async () => {
    if (ethToUseForDeposit) {
      await contract.deposit({
        value: ethers.utils.parseEther(ethToUseForDeposit),
      });
      setEthToUseForDeposit("");
    }
  };

  const withdrawFromEtherWalletContract = async () => {
    if (ethAddrToUseForWithdrawal && ethToUseForWithdrawal) {
      await contract.createWithdrawTx(
        ethAddrToUseForWithdrawal,
        ethers.utils.parseEther(ethToUseForWithdrawal)
      );

      setEthToUseForWithdrawal("");
      setEthAddrToUseForWithdrawal("");
    }
  };

  // Approve pending withdraw tx in the MultisigWallet smart contract
  const approvePendingTransaction = async (transactionIndex) => {
    await contract.approveWithdrawTx(transactionIndex);
  };

  return (
    <div className="container pt-5 col-lg-6 col-md-8">
      <div className="mb-4">
        <ConnectButton />
      </div>
      <div className="mb-5">
        <h3 className="text-5xl font-bold mb-20">{"Multisig Wallet Info"}</h3>
        <Row>
          <Col md="auto">Address:</Col>
          <Col>{multisigWalletContract.address}</Col>
        </Row>
        <Row>
          <Col md="auto">Balance:</Col>
          <Col>{scBalance ? scBalance / 10 ** 18 : 0} ETH</Col>
        </Row>
        <Row>
          <Col md="auto">Total Withdraw Transactions:</Col>
          <Col>
            {scTotalTransactionCount ? scTotalTransactionCount.toNumber() : 0}
          </Col>
        </Row>
        <Row>
          <Col md="auto">Owners:</Col>
          <Col>
            <ListGroup>
              {scOwners &&
                scOwners.map((scOwner, i) => {
                  return <ListGroup.Item key={i}>{scOwner}</ListGroup.Item>;
                })}
            </ListGroup>
          </Col>
        </Row>
      </div>
      <div className="mb-5">
        <Row>
          <h3 className="text-5xl font-bold mb-20">
            {"Deposit to EtherWallet Smart Contract"}
          </h3>
        </Row>
        <Row>
          <Form>
            <Form.Group className="mb-3" controlId="numberInEthDeposit">
              <Form.Control
                type="text"
                value={ethToUseForDeposit}
                placeholder="Enter the amount in ETH"
                onChange={(e) => setEthToUseForDeposit(e.target.value)}
                className="mb-2"
              />
              <Button variant="primary" onClick={depositToEtherWalletContract}>
                Deposit
              </Button>
            </Form.Group>
          </Form>
        </Row>
      </div>

      <div className="mb-5">
        <Row>
          <h3 className="text-5xl font-bold mb-20">
            {"Withdraw from EtherWallet Smart Contract"}
          </h3>
        </Row>
        <Row>
          <Form>
            <Form.Group className="mb-3" controlId="numberInEthWithdraw">
              <Form.Control
                type="text"
                value={ethToUseForWithdrawal}
                placeholder="Enter the amount in ETH"
                onChange={(e) => setEthToUseForWithdrawal(e.target.value)}
                className="mb-2"
              />
              <Form.Control
                type="text"
                value={ethAddrToUseForWithdrawal}
                placeholder="Enter the ETH address to withdraw to"
                onChange={(e) => setEthAddrToUseForWithdrawal(e.target.value)}
                className="mb-2"
              />
              <Button
                variant="primary"
                onClick={withdrawFromEtherWalletContract}
              >
                Withdraw
              </Button>
            </Form.Group>
          </Form>
        </Row>
      </div>

      <div className="pb-5">
        <Row>
          <h3 className="text-5xl font-bold mb-20">
            {"Pending Withdraw Transactions"}
          </h3>
        </Row>
        <Row>
          <div className="table-responsive">
            <Table striped hover>
              <thead>
                <tr className="text-white small">
                  <th>#</th>
                  <th>Receiver</th>
                  <th>Amount</th>
                  <th>No of Approvals</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {scPendingTransactions.map((tx, i) => {
                  return (
                    <tr className="text-white" key={i}>
                      <td>{i}</td>
                      <td
                        style={{
                          maxWidth: "200px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {tx.to}
                      </td>
                      <td>{tx.amount} ETH</td>
                      <td>{tx.approvals}</td>
                      <td>
                        <Button
                          variant="success"
                          onClick={() =>
                            approvePendingTransaction(tx.transactionIndex)
                          }
                        >
                          Approve
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>
        </Row>
      </div>
    </div>
  );
};
