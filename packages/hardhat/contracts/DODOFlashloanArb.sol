//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

// DODO flashoal 
// https://docs.dodoex.io/en/developer/contracts/dodo-v1-v2/guides/flash-loan
interface IDODO {
    function flashLoan(
        uint256 baseAmount,      // Token 1 amount to borrow
        uint256 quoteAmount,     // Token 2 amount to borrow
        address assetTo,         // Address to send the borrowed tokens to
        bytes calldata data      // Data to pass to the callback function
    ) external;
}

interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external;
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
}

contract DODOFlashloanArb {
    address public constant addressUSDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant addressUSDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    
    function dodoFlashLoan(
        address flashLoanPool,              // Address of the DODO USDT/DAI pool https://etherscan.io/address/0x3058ef90929cb8180174d74c507176cca6835d73#code
        uint256 loanAmount,                 // 400.000 
        address loanToken,                  // USDT address
        bool getFirstToken,                 // Borrow USDT or DAI, we'll borrow USDT
        address aggregator1,                // 1inch aggregator address
        bytes memory data1,                 // 1inch swap data 1
        address aggregator2,                // 1inch aggregator address (we could use other aggregators)
        bytes memory data2                  // 1inch swap data 2
    ) external {
        bytes memory data = abi.encode(
            flashLoanPool,
            loanAmount,
            loanToken,
            aggregator1,
            data1,
            aggregator2,
            data2
        );


        // Borrow token from DODO, send data for the callback function will be executed after the flashloan
        if (getFirstToken) {
            IDODO(flashLoanPool).flashLoan(loanAmount, 0, address(this), data);
        } else {
            IDODO(flashLoanPool).flashLoan(0, loanAmount, address(this), data);
        }
    }

    // Different DODO pools have different callback functions
    // All of these will call the same internal _flashLoanCallBack function

    //Note: CallBack function executed by DODOV2(DVM) flashLoan pool
    function DVMFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }
    //Note: CallBack function executed by DODOV2(DPP) flashLoan pool
    function DPPFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }
    //Note: CallBack function executed by DODOV2(DSP) flashLoan pool
    function DSPFlashLoanCall(
        address sender,
        uint256 baseAmount,
        uint256 quoteAmount,
        bytes calldata data
    ) external {
        _flashLoanCallBack(sender, baseAmount, quoteAmount, data);
    }

    // This is the callback function that will be executed after the flashloan
    // Here we should have the 400.000 USDT in our contract
    function _flashLoanCallBack(
        address sender,
        uint256,
        uint256,
        bytes calldata data
    ) internal {
        (
            address flashLoanPool,
            uint256 loanAmount,
            address loanToken,
            address aggregator1,
            bytes memory data1,
            address aggregator2,
            bytes memory data2
        ) = abi.decode(
                data,
                (address, uint256, address, address, bytes, address, bytes)
            );

        // Make sure that the call is coming from the DODO pool
        require(
            sender == address(this) && msg.sender == flashLoanPool,
            "HANDLE_FLASH_NENIED"
        );

        getAndLogERC20Balance(addressUSDT, address(this), "USDT balance before swaps");
        getAndLogERC20Balance(addressUSDC, address(this), "USDC balance before swaps");

        (bool success1, ) = aggregator1.call(data1);
        require(success1, "Swap 1 was not successfull");

        getAndLogERC20Balance(addressUSDT, address(this), "USDT balance after swap1");
        getAndLogERC20Balance(addressUSDC, address(this), "USDC balance after swap1");

        (bool success2, ) = aggregator2.call(data2);
        require(success2, "Swap 2 was not successfull");

        getAndLogERC20Balance(addressUSDT, address(this), "USDT balance after swap2");
        getAndLogERC20Balance(addressUSDC, address(this), "USDC balance after swap2");

        //Return funds
        IERC20(loanToken).transfer(flashLoanPool, loanAmount);

        getAndLogERC20Balance(addressUSDT, address(this), "USDT balance after returning the loan");
        getAndLogERC20Balance(addressUSDC, address(this), "USDC balance after returning the loan");
    }

    // This is a helper to call arbitrary functions on a contract
    // We will use this to approve the 1inch contract to spend our USDT/USDC
    // Could be used to get the USDT profit out from the contract (Should be guarded with an owner modifier)
    function anyThing(
        address to,
        uint256 value,
        bytes calldata data
    ) public {
        (bool success, ) = to.call{value: value}(data);

        require(success, "CALL_FAILED");
    }

    // Log the balance of an ERC20 token
    function getAndLogERC20Balance(address erc20TokenAddress, address balanceAddress, string memory state) public view returns (uint256) {
        uint256 balance = IERC20(erc20TokenAddress).balanceOf(balanceAddress);

        console.log("   hardhat/console.sol", state, balance);

        return balance;
    }
}
