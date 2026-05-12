// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract DemoUSDC is ERC20, Ownable {
    uint256 public constant FAUCET_AMOUNT = 10_000e6;
    uint256 public constant INITIAL_SUPPLY = 10_000_000e6;
    uint256 public constant MAX_SUPPLY = 100_000_000e6;

    mapping(address => bool) public hasClaimedFaucet;

    event FaucetClaimed(address indexed account, uint256 amount);

    constructor() ERC20("Demo USDC", "dUSDC") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function mint(address to, uint256 amount) external onlyOwner {
        _mintCapped(to, amount);
    }

    function claimDemoUsdc() external {
        require(!hasClaimedFaucet[msg.sender], "Faucet already claimed");

        hasClaimedFaucet[msg.sender] = true;
        _mintCapped(msg.sender, FAUCET_AMOUNT);

        emit FaucetClaimed(msg.sender, FAUCET_AMOUNT);
    }

    function _mintCapped(address to, uint256 amount) internal {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
    }
}
