# Copy Trading Safety Net Contracts

Smart contract MVP for an insurance protocol around AI copy trading strategies on 0G.

The core idea is simple: copiers can follow an AI strategy, buy coverage against drawdown, and receive an automatic payout when a registered TEE proof shows that the strategy loss crossed the selected threshold.

## Contract Map

```text
Strategy Provider
  -> StrategyRegistry.registerStrategy()
  -> StrategyRegistry.recordAttestation()

Copier
  -> StrategyRegistry.subscribe()
  -> PolicyManager.createPolicy()
  <- InsurancePool.payClaim()

Underwriter
  -> InsurancePool.deposit()
  <- InsurancePool.withdraw()

Keeper / Relayer / Anyone
  -> PolicyManager.triggerClaim()
```

## Contracts

### `StrategyRegistry`

Registry for AI trading strategies deployed as TEE-sealed agents on 0G Compute.

Responsibilities:
- register AI strategy metadata
- store strategy provider, subscription fee, risk score, and TEE agent ID
- handle copier subscriptions
- collect subscription fees for strategy providers
- record TEE trade execution proofs
- expose proof metadata for claim verification

Important functions:
- `registerStrategy(name, description, subscriptionFee, riskScore, teeAgentId, strategyStorageRoot, strategyConfigHash)`
- `subscribe(strategyId)`
- `recordAttestation(strategyId, proofHash, teeAttestationId, storageRoot, tradeReturn, executionTimestamp, teeProof)`
- `getAttestation(proofHash)`
- `getAttestations(strategyId)`
- `claimFees(strategyId)`

Proof fields:
- `proofHash`: hash of the TEE-signed execution proof
- `teeAttestationId`: keccak256 hash of the 0G TEE attestation identifier
- `storageRoot`: 0G Storage record/root for audit trail
- `tradeReturn`: strategy return in basis points, negative means loss
- `executionTimestamp`: timestamp of the strategy execution being attested
- `teeProof`: optional raw verifier proof bytes, used when an on-chain TEE verifier is configured

Strategy config commitments:
- `strategyStorageRoot`: 0G Storage root for the encrypted/sealed strategy config
- `strategyConfigHash`: canonical hash of the strategy config committed at registration
- Backend proof hashes commit to both values so attestations are tied to the registered sealed strategy, not only to a generic strategy ID

### `PolicyManager`

Creates and manages insurance policies for copiers.

Responsibilities:
- calculate premium from coverage amount, strategy risk score, and selected loss threshold
- require copier to be an active subscriber before buying coverage
- reserve coverage from `InsurancePool`
- execute auto-claim from registered TEE proof
- validate proof belongs to the same strategy as the policy
- derive loss from recorded `tradeReturn`, not from user input

Important functions:
- `calculatePremium(strategyId, coverageAmount, lossThreshold)`
- `createPolicy(strategyId, coverageAmount, lossThreshold)`
- `triggerClaim(policyId, proofHash)`
- `cancelPolicy(policyId)`
- `expirePolicy(policyId)`
- `getPolicy(policyId)`
- `getCopierPolicies(copier)`
- `getStrategyPolicies(strategyId)`

Claim validation:
- policy must be active
- policy must not be expired
- proof must be registered in `StrategyRegistry`
- proof must not have been used for the same policy
- proof strategy must match policy strategy
- recorded `tradeReturn` must be negative
- derived loss must be greater than or equal to policy threshold

### `InsurancePool`

USDC liquidity pool for underwriters.

Responsibilities:
- accept underwriter deposits
- mint proportional pool shares
- block withdrawals against reserved coverage
- receive policy premiums
- pay approved claims
- expose pool stats for frontend

Important functions:
- `deposit(amount)`
- `withdraw(shareAmount)`
- `receivePremium(policyId, amount)`
- `reserveCoverage(amount)`
- `releaseReserve(amount)`
- `payClaim(policyId, claimant, amount)`
- `availableLiquidity()`
- `shareValue(underwriter)`
- `poolStats()`

### `DemoUSDC`

Mainnet-demo ERC20 token with 6 decimals.

Used when the target network does not provide an official stablecoin address.
It includes:
- owner-only `mint(address, amount)` for controlled demo funding
- public one-time `claimDemoUsdc()` faucet for judges/testers
- capped supply to keep demo state bounded

## Main Flow

1. Underwriter deposits USDC into `InsurancePool`.
2. Strategy provider registers an AI strategy with a 0G TEE agent ID.
3. Copier subscribes to the strategy through `StrategyRegistry`.
4. Copier creates a policy through `PolicyManager`.
5. `PolicyManager` transfers premium into `InsurancePool`.
6. `InsurancePool` reserves coverage amount so underwriters cannot withdraw committed liquidity.
7. Strategy provider or trusted relayer records a TEE proof in `StrategyRegistry`.
8. Anyone calls `PolicyManager.triggerClaim(policyId, proofHash)`.
9. `PolicyManager` reads proof metadata from `StrategyRegistry`.
10. If proof is valid and loss crosses threshold, `InsurancePool` pays the copier.

## Demo Scenario

Recommended demo path:

1. Mint demo USDC to underwriter and copier.
2. Underwriter deposits `50,000 USDC`.
3. Provider registers `Alpha Momentum` with risk score `40`.
4. Copier subscribes for `10 USDC`.
5. Copier buys `1,000 USDC` coverage with `20%` loss threshold.
6. Provider records TEE proof with `tradeReturn = -3000` basis points.
7. Keeper calls `triggerClaim(policyId, proofHash)`.
8. Copier receives `1,000 USDC` payout.
9. Frontend shows:
   - policy status `Claimed`
   - proof hash
   - TEE attestation ID
   - 0G Storage root
   - payout transaction

## Frontend Events

Useful events for indexing and UI updates:

`StrategyRegistry`:
- `StrategyRegistered(strategyId, provider, name, riskScore, strategyStorageRoot, strategyConfigHash)`
- `Subscribed(strategyId, copier, expiry)`
- `AttestationRecorded(strategyId, proofHash, teeAttestationId, storageRoot, tradeReturn, executionTimestamp)`
- `FeesClaimed(strategyId, provider, amount)`
- `StrategyDeactivated(strategyId)`

`PolicyManager`:
- `PolicyCreated(policyId, copier, strategyId, coverageAmount, premium, lossThreshold)`
- `ClaimTriggered(policyId, copier, proofHash, lossBps, teeAttestationId, storageRoot)`
- `ClaimApproved(policyId, copier, payout)`
- `PolicyExpired(policyId)`
- `PolicyCancelled(policyId)`

`InsurancePool`:
- `Deposited(underwriter, amount, sharesIssued)`
- `Withdrawn(underwriter, sharesRedeemed, amount)`
- `PremiumReceived(policyId, amount)`
- `CoverageReserved(amount)`
- `ReserveReleased(amount)`
- `ClaimPaid(policyId, claimant, amount)`

## MVP Assumptions

- TEE verification is represented by a registered proof hash and metadata until 0G exposes a canonical on-chain verifier. The contracts already include an optional `teeVerifier` hook and `teeProof` bytes path.
- `recordAttestation()` is callable by the strategy provider or contract owner. In production this should likely be a verified 0G relayer, attestation verifier, or strategy execution oracle.
- Payout is currently full `coverageAmount` once threshold is breached. A production version may use partial payout based on realized loss.
- Premium pricing is deterministic and simplified: base rate, strategy risk score, and threshold discount.
- Policy duration is fixed at `30 days`.
- Strategy execution and copier trade replication happen off-chain or in adjacent protocol components; these contracts handle subscription, registered strategy config commitments, proof registry, insurance accounting, and claim payout.

## Commands

```shell
forge build
forge test -vv
forge fmt
```

## Deploy

```shell
forge script script/Deploy.s.sol:Deploy --rpc-url <rpc_url> --private-key <private_key> --broadcast
```

`Deploy.s.sol` also registers three demo strategies and writes deployment
addresses to `deployments/latest.json` by default. Optional env vars:

```shell
JUDGE_WALLET=0x...
SEED_POOL_AMOUNT=50000000000
DEPLOY_OUTPUT=deployments/0g-mainnet.json
```

## Demo Flow Smoke Test

After deployment, run a full on-chain demo flow with separate copier and
underwriter keys:

```shell
forge script script/DemoFlow.s.sol:DemoFlow \
  --rpc-url <rpc_url> \
  --broadcast
```

Required env vars:

```shell
PRIVATE_KEY=<owner_or_provider_key>
COPIER_PRIVATE_KEY=<copier_key>
UNDERWRITER_PRIVATE_KEY=<underwriter_key>
DEMO_USDC_ADDRESS=0x...
STRATEGY_REGISTRY_ADDRESS=0x...
INSURANCE_POOL_ADDRESS=0x...
POLICY_MANAGER_ADDRESS=0x...
```
