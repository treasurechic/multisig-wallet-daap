// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

error TxNotExists(uint256 transactionIndex);

error TxAlreadyApproved(uint256 transactionIndex);

error TxAlreadySent(uint256 transactionIndex);

contract MultisigWallet {
    event Deposit(address indexed sender, uint256 amount, uint256 balance);

    event CreateWithdrawTx(
        address indexed owner,
        uint256 indexed transactionIndex,
        address indexed to,
        uint256 amount
    );

    event ApproveWithdrawTx(
        address indexed owner,
        uint256 indexed transactionIndex
    );

    address[] public owners;

    mapping(address => bool) public isOwner;

    uint256 public quorumRequired;

    struct WithdrawTx {
        address to;
        uint256 amount;
        uint256 approvals;
        bool sent;
    }

    mapping(uint256 => mapping(address => bool)) public isApproved;

    WithdrawTx[] public WithdrawTxes;

    constructor(address[] memory _owners, uint256 _quorumRequired) {
        require(_owners.length > 0, "Owners required");
        require(
            _quorumRequired > 0 && _quorumRequired <= _owners.length,
            "Invalid number of required quorom"
        );

        for (uint256 i = 0; i < _owners.length; i++) {
            address owner = _owners[i];
            require(owner != address(0), "Invalid Owner");
            require(!isOwner[owner], "Invalid Owner");

            isOwner[owner] = true;
            owners.push(owner);
        }
        quorumRequired = _quorumRequired;
    }

    modifier transactionExists(uint256 transactionIndex) {
        if (transactionIndex > WithdrawTxes.length) {
            revert TxNotExists(transactionIndex);
        }
        _;
    }

    modifier transactionNotApproved(uint256 transactionIndex) {
        if (isApproved[transactionIndex][msg.sender]) {
            revert TxAlreadyApproved(transactionIndex);
        }
        _;
    }

    modifier transactionNotSent(uint256 transactionIndex) {
        if (WithdrawTxes[transactionIndex].sent) {
            revert TxAlreadySent(transactionIndex);
        }
        _;
    }

    function createWithdrawTx(address to, uint256 amount) public onlyOwner {
        uint256 transactionIndex = WithdrawTxes.length;
        WithdrawTxes.push(
            WithdrawTx({to: to, amount: amount, approvals: 0, sent: false})
        );

        emit CreateWithdrawTx(msg.sender, transactionIndex, to, amount);
    }

    function approveWithdrawTx(
        uint256 _transactionIndex
    )
        public
        onlyOwner
        transactionExists(_transactionIndex)
        transactionNotApproved(_transactionIndex)
    {
        WithdrawTx storage withdrawTx = WithdrawTxes[_transactionIndex];
        withdrawTx.approvals += 1;
        isApproved[_transactionIndex][msg.sender] = true;
        if (withdrawTx.approvals >= quorumRequired) {
            withdrawTx.sent = true;
            (bool success, ) = withdrawTx.to.call{value: withdrawTx.amount}(
                " "
            );
            require(success, "Transaction failed");
            emit ApproveWithdrawTx(msg.sender, _transactionIndex);
        }
    }

    function getOwners() public view returns (address[] memory) {
        return owners;
    }

    function getWithdrawTxCount() public view returns (uint256) {
        return WithdrawTxes.length;
    }

    function getWithdrawTxes() public view returns (WithdrawTx[] memory) {
        return WithdrawTxes;
    }

    function getWithdrawTx(
        uint256 _transactionIndex
    )
        public
        view
        returns (address to, uint256 amount, uint256 approvals, bool sent)
    {
        WithdrawTx storage withdrawTx = WithdrawTxes[_transactionIndex];
        return (
            withdrawTx.to,
            withdrawTx.amount,
            withdrawTx.approvals,
            withdrawTx.sent
        );
    }

    function deposit() public payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    receive() external payable {
        emit Deposit(msg.sender, msg.value, address(this).balance);
    }

    function balanceOf() public view returns (uint256) {
        return address(this).balance;
    }

    modifier onlyOwner() {
        require(isOwner[msg.sender], "not owner");
        _;
    }
}
