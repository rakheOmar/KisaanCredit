pragma solidity ^0.8.0;

import "hardhat/console.sol"; // Useful for logging during development

contract PaymentLogger {
    // ... (Your Payment struct and other code) ...
    // You can keep the rest of the contract the same
    struct Payment {
        string razorpay_order_id;
        string razorpay_payment_id;
        uint256 amount;
        string currency;
        uint256 timestamp;
    }

    Payment[] public payments;
    mapping(string => bool) private _paymentExists;

    event PaymentLogged(
        string razorpay_order_id,
        string razorpay_payment_id,
        uint256 amount,
        string currency,
        uint256 timestamp
    );

    function logPayment(
        string memory _razorpay_order_id,
        string memory _razorpay_payment_id,
        uint256 _amount,
        string memory _currency
    ) public {
        require(!_paymentExists[_razorpay_payment_id], "Payment already logged.");

        Payment memory newPayment = Payment({
            razorpay_order_id: _razorpay_order_id,
            razorpay_payment_id: _razorpay_payment_id,
            amount: _amount,
            currency: _currency,
            timestamp: block.timestamp
        });

        payments.push(newPayment);
        _paymentExists[_razorpay_payment_id] = true;

        emit PaymentLogged(
            _razorpay_order_id,
            _razorpay_payment_id,
            _amount,
            _currency,
            block.timestamp
        );
    }

    function getPaymentsCount() public view returns (uint256) {
        return payments.length;
    }
}