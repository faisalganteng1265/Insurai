import { parseAbi } from "viem";

export const strategyRegistryAbi = parseAbi([
  // Write
  "function registerStrategy(string name, string description, uint256 subscriptionFee, uint256 riskScore, bytes32 teeAgentId, bytes32 strategyStorageRoot, bytes32 strategyConfigHash) external returns (uint256 strategyId)",
  "function subscribe(uint256 strategyId) external",
  "function recordAttestation(uint256 strategyId, bytes32 proofHash, bytes32 teeAttestationId, bytes32 storageRoot, int256 tradeReturn, uint256 executionTimestamp, bytes teeProof) external",
  "function claimFees(uint256 strategyId) external",
  "function deactivateStrategy(uint256 strategyId) external",
  "function setAuthorizedAttestor(address attestor, bool authorized) external",
  "function setTeeVerifier(address verifier) external",
  "function pause() external",
  "function unpause() external",
  // Read
  "function strategyCount() external view returns (uint256)",
  "function getStrategy(uint256 strategyId) external view returns ((uint256,address,string,string,uint256,uint256,bool,uint256,uint256,bytes32,bytes32,bytes32))",
  "function getAttestations(uint256 strategyId) external view returns ((bytes32,bytes32,bytes32,int256,uint256,uint256)[])",
  "function getAttestation(bytes32 proofHash) external view returns (uint256 strategyId, bytes32 teeAttestationId, bytes32 storageRoot, int256 tradeReturn, uint256 executionTimestamp, uint256 recordedAt)",
  "function isActiveSubscriber(uint256 strategyId, address copier) external view returns (bool)",
  "function usedAttestations(bytes32 proofHash) external view returns (bool)",
  "function getProviderStrategies(address provider) external view returns (uint256[])",
  "function subscriptionExpiry(uint256 strategyId, address copier) external view returns (uint256)",
  "function pendingFees(uint256 strategyId) external view returns (uint256)",
  "function teeVerifier() external view returns (address)",
  "function paused() external view returns (bool)",
  // Events
  "event StrategyRegistered(uint256 indexed strategyId, address indexed provider, string name, uint256 riskScore, bytes32 strategyStorageRoot, bytes32 strategyConfigHash)",
  "event Subscribed(uint256 indexed strategyId, address indexed copier, uint256 expiry)",
  "event AttestationRecorded(uint256 indexed strategyId, bytes32 indexed proofHash, bytes32 teeAttestationId, bytes32 storageRoot, int256 tradeReturn, uint256 executionTimestamp)",
  "event FeesClaimed(uint256 indexed strategyId, address indexed provider, uint256 amount)",
  "event StrategyDeactivated(uint256 indexed strategyId)",
  "event AttestorAuthorizationSet(address indexed attestor, bool authorized)",
  "event TeeVerifierSet(address indexed verifier)",
]);

export const policyManagerAbi = parseAbi([
  // Write
  "function createPolicy(uint256 strategyId, uint256 coverageAmount, uint256 lossThreshold) external returns (uint256 policyId)",
  "function triggerClaim(uint256 policyId, bytes32 proofHash) external",
  "function cancelPolicy(uint256 policyId) external",
  "function expirePolicy(uint256 policyId) external",
  "function pause() external",
  "function unpause() external",
  // Read
  "function policyCount() external view returns (uint256)",
  "function getPolicy(uint256 policyId) external view returns ((uint256,address,uint256,uint256,uint256,uint256,uint256,uint256,uint8,bytes32,bytes32,bytes32))",
  "function getCopierPolicies(address copier) external view returns (uint256[])",
  "function getStrategyPolicies(uint256 strategyId) external view returns (uint256[])",
  "function calculatePremium(uint256 strategyId, uint256 coverageAmount, uint256 lossThreshold) external view returns (uint256 premium)",
  "function BASE_RATE_BPS() external view returns (uint256)",
  "function COVERAGE_DURATION() external view returns (uint256)",
  "function usedPolicyClaimAttestations(uint256 policyId, bytes32 proofHash) external view returns (bool)",
  "function paused() external view returns (bool)",
  // Events
  "event PolicyCreated(uint256 indexed policyId, address indexed copier, uint256 indexed strategyId, uint256 coverageAmount, uint256 premium, uint256 lossThreshold)",
  "event ClaimTriggered(uint256 indexed policyId, address indexed copier, bytes32 indexed proofHash, uint256 lossBps, bytes32 teeAttestationId, bytes32 storageRoot)",
  "event ClaimApproved(uint256 indexed policyId, address indexed copier, uint256 payout)",
  "event PolicyExpired(uint256 indexed policyId)",
  "event PolicyCancelled(uint256 indexed policyId)",
]);

export const insurancePoolAbi = parseAbi([
  // Write
  "function deposit(uint256 amount) external",
  "function withdraw(uint256 shareAmount) external",
  "function receivePremium(uint256 policyId, uint256 amount) external",
  "function reserveCoverage(uint256 amount) external",
  "function releaseReserve(uint256 amount) external",
  "function payClaim(uint256 policyId, address claimant, uint256 amount) external",
  "function setPolicyManager(address _policyManager) external",
  // Read
  "function totalDeposits() external view returns (uint256)",
  "function totalShares() external view returns (uint256)",
  "function totalPremiumsCollected() external view returns (uint256)",
  "function totalClaimsPaid() external view returns (uint256)",
  "function reservedForClaims() external view returns (uint256)",
  "function availableLiquidity() external view returns (uint256)",
  "function poolStats() external view returns (uint256 _totalDeposits, uint256 _premiumsCollected, uint256 _claimsPaid, uint256 _available, uint256 _utilizationBps)",
  "function shareValue(address underwriter) external view returns (uint256)",
  "function shares(address underwriter) external view returns (uint256)",
  // Events
  "event Deposited(address indexed underwriter, uint256 amount, uint256 sharesIssued)",
  "event Withdrawn(address indexed underwriter, uint256 sharesRedeemed, uint256 amount)",
  "event PremiumReceived(uint256 indexed policyId, uint256 amount)",
  "event ClaimPaid(uint256 indexed policyId, address indexed claimant, uint256 amount)",
  "event CoverageReserved(uint256 amount)",
  "event ReserveReleased(uint256 amount)",
]);

export const demoUsdcAbi = parseAbi([
  "function mint(address to, uint256 amount) external",
  "function claimDemoUsdc() external",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function decimals() external pure returns (uint8)",
  "function FAUCET_AMOUNT() external view returns (uint256)",
  "function hasClaimedFaucet(address account) external view returns (bool)",
  "event FaucetClaimed(address indexed account, uint256 amount)",
]);
