pragma solidity ^0.8.20;

import "hardhat/console.sol";

contract CreditLedger {
    struct Credit {
        uint256 id;
        address issuer;
        string recipientUserId;
        uint256 creditAmount;
        uint256 pricePerCredit;
        string creditType;
        string reason;
        string description;
        uint256 validityPeriod;
        uint256 issuedAt;
    }

    Credit[] public allCredits;

    event CreditIssued(
        uint256 indexed creditId,
        address indexed issuer,
        string recipientUserId,
        uint256 creditAmount
    );

    function issueCredit(
        string memory _recipientUserId,
        uint256 _creditAmount,
        uint256 _pricePerCredit,
        string memory _creditType,
        string memory _reason,
        string memory _description,
        uint256 _validityPeriod
    ) public {
        Credit memory newCredit = Credit({
            id: allCredits.length,
            issuer: msg.sender,
            recipientUserId: _recipientUserId,
            creditAmount: _creditAmount,
            pricePerCredit: _pricePerCredit,
            creditType: _creditType,
            reason: _reason,
            description: _description,
            validityPeriod: _validityPeriod,
            issuedAt: block.timestamp
        });

        allCredits.push(newCredit);

        emit CreditIssued(
            newCredit.id,
            msg.sender,
            _recipientUserId,
            _creditAmount
        );
    }

    function getCreditsCount() public view returns (uint256) {
        return allCredits.length;
    }

    function getCreditById(uint256 _id) public view returns (Credit memory) {
        require(_id < allCredits.length, "Credit ID out of bounds");
        return allCredits[_id];
    }
}