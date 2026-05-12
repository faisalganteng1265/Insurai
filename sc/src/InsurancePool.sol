// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice USDC liquidity pool for underwriters.
///         Underwriters deposit USDC to earn premium yield.
///         PolicyManager reserves coverage and pays claims from this pool.
contract InsurancePool is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable usdc;
    address public policyManager;

    uint256 public totalDeposits;
    uint256 public totalShares;
    uint256 public totalPremiumsCollected;
    uint256 public totalClaimsPaid;
    uint256 public reservedForClaims;

    mapping(address => uint256) public shares;

    event Deposited(address indexed underwriter, uint256 amount, uint256 sharesIssued);
    event Withdrawn(address indexed underwriter, uint256 sharesRedeemed, uint256 amount);
    event PremiumReceived(uint256 indexed policyId, uint256 amount);
    event ClaimPaid(uint256 indexed policyId, address indexed claimant, uint256 amount);
    event CoverageReserved(uint256 amount);
    event ReserveReleased(uint256 amount);
    event PolicyManagerSet(address policyManager);

    modifier onlyPolicyManager() {
        require(msg.sender == policyManager, "Only PolicyManager");
        _;
    }

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
    }

    function setPolicyManager(address _policyManager) external onlyOwner {
        require(policyManager == address(0), "PolicyManager already set");
        require(_policyManager != address(0), "Invalid PolicyManager");
        policyManager = _policyManager;
        emit PolicyManagerSet(_policyManager);
    }

    function deposit(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be > 0");

        uint256 sharesToIssue;
        if (totalShares == 0 || totalDeposits == 0) {
            sharesToIssue = amount;
        } else {
            sharesToIssue = (amount * totalShares) / totalDeposits;
        }

        usdc.safeTransferFrom(msg.sender, address(this), amount);

        shares[msg.sender] += sharesToIssue;
        totalShares += sharesToIssue;
        totalDeposits += amount;

        emit Deposited(msg.sender, amount, sharesToIssue);
    }

    function withdraw(uint256 shareAmount) external nonReentrant {
        require(shares[msg.sender] >= shareAmount, "Insufficient shares");
        require(shareAmount > 0, "Amount must be > 0");

        uint256 usdcAmount = (shareAmount * totalDeposits) / totalShares;
        require(usdcAmount <= availableLiquidity(), "Insufficient available liquidity");

        shares[msg.sender] -= shareAmount;
        totalShares -= shareAmount;
        totalDeposits -= usdcAmount;

        usdc.safeTransfer(msg.sender, usdcAmount);

        emit Withdrawn(msg.sender, shareAmount, usdcAmount);
    }

    /// @notice Called by PolicyManager when premium is forwarded to the pool.
    function receivePremium(uint256 policyId, uint256 amount) external onlyPolicyManager {
        totalDeposits += amount;
        totalPremiumsCollected += amount;
        emit PremiumReceived(policyId, amount);
    }

    /// @notice Locks coverage amount so underwriters cannot withdraw it.
    function reserveCoverage(uint256 amount) external onlyPolicyManager {
        require(availableLiquidity() >= amount, "Insufficient pool liquidity");
        reservedForClaims += amount;
        emit CoverageReserved(amount);
    }

    /// @notice Releases a previously reserved amount (on policy expiry or cancellation).
    function releaseReserve(uint256 amount) external onlyPolicyManager {
        reservedForClaims = amount > reservedForClaims ? 0 : reservedForClaims - amount;
        emit ReserveReleased(amount);
    }

    /// @notice Pays out a claim directly to the claimant.
    function payClaim(uint256 policyId, address claimant, uint256 amount) external onlyPolicyManager nonReentrant {
        require(amount <= totalDeposits, "Insufficient pool funds");

        reservedForClaims = amount > reservedForClaims ? 0 : reservedForClaims - amount;
        totalDeposits -= amount;
        totalClaimsPaid += amount;

        usdc.safeTransfer(claimant, amount);

        emit ClaimPaid(policyId, claimant, amount);
    }

    function availableLiquidity() public view returns (uint256) {
        if (totalDeposits <= reservedForClaims) return 0;
        return totalDeposits - reservedForClaims;
    }

    function shareValue(address underwriter) external view returns (uint256) {
        if (totalShares == 0) return 0;
        return (shares[underwriter] * totalDeposits) / totalShares;
    }

    function poolStats()
        external
        view
        returns (
            uint256 _totalDeposits,
            uint256 _premiumsCollected,
            uint256 _claimsPaid,
            uint256 _available,
            uint256 _utilizationBps
        )
    {
        _totalDeposits = totalDeposits;
        _premiumsCollected = totalPremiumsCollected;
        _claimsPaid = totalClaimsPaid;
        _available = availableLiquidity();
        _utilizationBps = totalDeposits > 0 ? (reservedForClaims * 10_000) / totalDeposits : 0;
    }
}
