## Invoice Verification Process
Ensuring invoice legitimacy is essential to building trust in the InvoFi protocol. We use a hybrid 3-step verification framework combining cryptographic confirmation, automation, and decentralized human review.

### 🔹 Step 1: On-Chain Debtor Confirmation
- When a business uploads an invoice, we require the invoice counterparty (debtor) to confirm it.
- This is done via a digital signature on-chain, linked to the invoice NFT.
- This creates:
    - A tamper-proof record of agreement
    - Cryptographic assurance that the debt is acknowledged
- If the debtor doesn’t confirm, the invoice cannot be financed.

## 🔹 Step 2: Automated Checks
Our platform analyzes each submitted invoice using a set of **automated proprietary validations** (subject to change):

|Check Type|Description|
|---|---|
| KYB & Identity Match  | Verify the uploader is a registered, valid business  |
| Metadata Parsing | Analyze fields like amount, due date, and debtor identity|
| Duplicate Detection |	Prevent resubmission of the same invoice |
| Debtor Existence Check |	Confirm debtor’s legal entity exists via registry APIs |
| Risk Scoring |	Evaluate risk based on invoice term, size, and timing |
	
These checks minimize fraud and reduce the burden on manual reviewers.

### 🔹 Step 3: Decentralized Manual Review
For added assurance, we use a network of third-party **human reviewers**:

- Reviewers are chosen randomly from a pool of verified providers
- They operate under a decentralized review protocol
- Tasks include:
    - Authenticity check (invoice structure, signatures)
    - Cross-check with supporting documents (contracts, delivery notes)
    - Basic fraud pattern recognition

To prevent collusion:
- Reviews are be anonymous
- Random assignment ensures decentralization and quality control

Over time, the need for manual review is reduced as our automated systems evolve.
