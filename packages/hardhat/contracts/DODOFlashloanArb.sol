//SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";

interface IDODO {
    function flashLoan(
        uint256 baseAmount,
        uint256 quoteAmount,
        address assetTo,
        bytes calldata data
    ) external;
}

interface IERC20 {
    function transfer(address to, uint256 value) external;

    function balanceOf(address account) external view returns (uint256);
}

contract DODOFlashloanArb {
    // Define constant variables for USDT and USDC tokens
    address public constant addressUSDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address public constant addressUSDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    function anyThing(
        address to,
        uint256 value,
        bytes calldata data
    ) public {
        (bool success, ) = to.call{value: value}(data);

        require(success, "CALL_FAILED");
    }
    
    function dodoFlashLoan(
        address flashLoanPool,
        uint256 loanAmount,
        address loanToken,
        bool getFirstToken,
        address aggregator1,
        bytes memory data1,
        address aggregator2,
        bytes memory data2
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

        getERC20Balance(addressUSDT, flashLoanPool);

        console.log("flashLoanPool", flashLoanPool);
        console.log("loanAmount", loanAmount);
        console.log("loanToken", loanToken);
        console.log("aggregator1", aggregator1);
        console.logBytes(data1);
        console.log("aggregator2", aggregator2);
        console.logBytes(data2);
        
        console.log("brrrr");

        console.logBytes(data);

        if (getFirstToken) {
            IDODO(flashLoanPool).flashLoan(loanAmount, 0, address(this), data);
        } else {
            IDODO(flashLoanPool).flashLoan(0, loanAmount, address(this), data);
        }
    }

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

        getERC20Balance(addressUSDT, flashLoanPool);

        require(
            sender == address(this) && msg.sender == flashLoanPool,
            "HANDLE_FLASH_NENIED"
        );

        uint256 balanceUSDTBefore = IERC20(
            0xdAC17F958D2ee523a2206206994597C13D831ec7
        ).balanceOf(address(this));

        (bool success1, ) = aggregator1.call(data1);
        require(success1, "Swap 1 was not successfull");

        uint256 balanceUSDTAfter = IERC20(
            0xdAC17F958D2ee523a2206206994597C13D831ec7
        ).balanceOf(address(this));

        uint256 balanceUSDC = IERC20(
            0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48
        ).balanceOf(0xA951C184cF0c0f957468a9ab8Ec3f76BC75262eb);

        console.log("balanceUSDTBefore", balanceUSDTBefore);
        console.log("balanceUSDTAfter", balanceUSDTAfter);
        console.log("balanceUSDC", balanceUSDC);

        (bool success2, ) = aggregator2.call(data2);
        require(success2, "Swap 2 was not successfull");

        //Return funds
        IERC20(loanToken).transfer(flashLoanPool, loanAmount);
    }

    function getERC20Balance(address erc20TokenAddress, address balanceAddress) public view returns (uint256) {
        uint256 balance = IERC20(erc20TokenAddress).balanceOf(balanceAddress);

        console.log( erc20TokenAddress, balanceAddress, balance);

        return balance;
    }
}
