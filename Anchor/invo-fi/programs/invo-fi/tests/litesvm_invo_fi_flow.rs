use anchor_lang::{
    solana_program::instruction::AccountMeta as AnchorAccountMeta,
    AccountDeserialize, InstructionData, ToAccountMetas,
};
use anchor_spl::token;
use invo_fi::state::invoice::{Invoice, InvoiceStatus};
use litesvm::LiteSVM;
use litesvm_token::{
    get_spl_account,
    spl_token::state::Account as TokenAccount,
    CreateAccount as TokenCreateAccount,
    CreateMint,
    MintTo,
};
use solana_account::Account;
use solana_instruction::{account_meta::AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_signer::Signer;
use solana_transaction::Transaction;
use solana_sdk_ids::system_program;
use std::{error::Error, io, path::Path};

const DEFAULT_AIRDROP_LAMPORTS: u64 = 5_000_000_000;
const DEFAULT_DEBTOR_USDC_BALANCE: u64 = 2_000_000_000;
const USDC_DECIMALS: u8 = 6;

type TestResult<T = ()> = Result<T, Box<dyn Error>>;

fn program_artifact_path() -> &'static str {
    concat!(env!("CARGO_MANIFEST_DIR"), "/../../target/deploy/invo_fi.so")
}

fn program_id() -> Pubkey {
    Pubkey::new_from_array(invo_fi::ID.to_bytes())
}

fn to_anchor_pubkey(pubkey: &Pubkey) -> anchor_lang::solana_program::pubkey::Pubkey {
    anchor_lang::solana_program::pubkey::Pubkey::new_from_array(pubkey.to_bytes())
}

fn to_solana_pubkey(pubkey: &anchor_lang::solana_program::pubkey::Pubkey) -> Pubkey {
    Pubkey::new_from_array(pubkey.to_bytes())
}

fn system_program_anchor_id() -> anchor_lang::solana_program::pubkey::Pubkey {
    anchor_lang::solana_program::pubkey::Pubkey::new_from_array(system_program::ID.to_bytes())
}

fn convert_metas(metas: Vec<AnchorAccountMeta>) -> Vec<AccountMeta> {
    metas
        .into_iter()
        .map(|meta| AccountMeta {
            pubkey: Pubkey::new_from_array(meta.pubkey.to_bytes()),
            is_signer: meta.is_signer,
            is_writable: meta.is_writable,
        })
        .collect()
}

fn load_program_or_skip() -> Option<LiteSVM> {
    let artifact = Path::new(program_artifact_path());
    if !artifact.exists() {
        eprintln!("Skipping test, missing {}", artifact.display());
        return None;
    }

    let pid = program_id();
    let mut svm = LiteSVM::new().with_default_programs();
    if let Err(err) = svm.add_program_from_file(pid, artifact) {
        eprintln!("Skipping test, could not load program: {err:?}");
        return None;
    }
    Some(svm)
}

struct TestHarness {
    svm: LiteSVM,
    program_id: Pubkey,
}

impl TestHarness {
    fn new() -> Option<Self> {
        load_program_or_skip().map(|svm| Self {
            svm,
            program_id: program_id(),
        })
    }

    fn svm(&self) -> &LiteSVM {
        &self.svm
    }

    fn svm_mut(&mut self) -> &mut LiteSVM {
        &mut self.svm
    }

    fn program_id(&self) -> Pubkey {
        self.program_id
    }

    fn airdrop(&mut self, recipient: &Pubkey, amount: u64) -> TestResult {
        self.svm
            .airdrop(recipient, amount)
            .map_err(|err| io::Error::new(io::ErrorKind::Other, format!("airdrop failed: {err:?}")))?;
        Ok(())
    }

    fn send(&mut self, ix: Instruction, signer: &Keypair) -> TestResult {
        let blockhash = self.svm.latest_blockhash();
        let message = Message::new(&[ix], Some(&signer.pubkey()));
        let mut tx = Transaction::new_unsigned(message);
        tx.sign(&[signer], blockhash);
        self.svm
            .send_transaction(tx)
            .map_err(|err| io::Error::new(io::ErrorKind::Other, format!("transaction failed: {err:?}")))?;
        Ok(())
    }

    fn account(&self, key: &Pubkey) -> Option<Account> {
        self.svm.get_account(key)
    }
}

#[derive(Clone, Copy)]
struct InvoiceTerms {
    total_amount: u64,
    purchase_price: u64,
    due_date: i64,
    risk_rating: u8,
}

impl Default for InvoiceTerms {
    fn default() -> Self {
        Self {
            total_amount: 1_200_000,
            purchase_price: 1_000_000,
            due_date: 1_700_000_000,
            risk_rating: 3,
        }
    }
}

#[derive(Clone)]
struct ScenarioConfig {
    invoice_terms: InvoiceTerms,
    lp_contributions: Vec<u64>,
    debtor_balance: u64,
}

impl Default for ScenarioConfig {
    fn default() -> Self {
        Self {
            invoice_terms: InvoiceTerms::default(),
            lp_contributions: Vec::new(),
            debtor_balance: DEFAULT_DEBTOR_USDC_BALANCE,
        }
    }
}

impl ScenarioConfig {
    fn with_lp_contributions(mut self, contributions: Vec<u64>) -> Self {
        self.lp_contributions = contributions;
        self
    }

    fn with_terms(mut self, terms: InvoiceTerms) -> Self {
        self.invoice_terms = terms;
        self
    }

    fn with_debtor_balance(mut self, balance: u64) -> Self {
        self.debtor_balance = balance;
        self
    }
}

struct ActorWallet {
    signer: Keypair,
    usdc_account: Pubkey,
}

impl ActorWallet {
    fn pubkey(&self) -> Pubkey {
        self.signer.pubkey()
    }
}

struct LiquidityProvider {
    wallet: ActorWallet,
    planned_contribution: u64,
}

struct InvoiceFixture {
    harness: TestHarness,
    config: ScenarioConfig,
    invoice_mint: Pubkey,
    usdc_mint: Pubkey,
    invoice_pda: Pubkey,
    usdc_vault: Pubkey,
    issuer: ActorWallet,
    debtor: ActorWallet,
    lps: Vec<LiquidityProvider>,
}

impl InvoiceFixture {
    fn setup(config: ScenarioConfig) -> TestResult<Option<Self>> {
        let mut harness = match TestHarness::new() {
            Some(h) => h,
            None => return Ok(None),
        };

        let issuer = Keypair::new();
        let debtor = Keypair::new();

        for signer in [&issuer, &debtor] {
            harness.airdrop(&signer.pubkey(), DEFAULT_AIRDROP_LAMPORTS)?;
        }

        let invoice_mint = CreateMint::new(harness.svm_mut(), &issuer)
            .authority(&issuer.pubkey())
            .decimals(0)
            .send()
            .map_err(|err| io::Error::new(io::ErrorKind::Other, format!("invoice mint failed: {err:?}")))?;

        let usdc_mint = CreateMint::new(harness.svm_mut(), &issuer)
            .authority(&issuer.pubkey())
            .decimals(USDC_DECIMALS)
            .send()
            .map_err(|err| io::Error::new(io::ErrorKind::Other, format!("usdc mint failed: {err:?}")))?;

        let (invoice_pda, _) =
            Pubkey::find_program_address(&[b"invoice", invoice_mint.as_ref()], &harness.program_id());
        let (usdc_vault, _) =
            Pubkey::find_program_address(&[b"vault", invoice_pda.as_ref()], &harness.program_id());

        let issuer_wallet = create_wallet_with_tokens(&mut harness, issuer, &usdc_mint, None, 0)?;
        let debtor_wallet = create_wallet_with_tokens(
            &mut harness,
            debtor,
            &usdc_mint,
            Some(&issuer_wallet.signer),
            config.debtor_balance,
        )?;

        let mut lps = Vec::with_capacity(config.lp_contributions.len());
        for contribution in &config.lp_contributions {
            let lp_signer = Keypair::new();
            harness.airdrop(&lp_signer.pubkey(), DEFAULT_AIRDROP_LAMPORTS)?;
            let wallet = create_wallet_with_tokens(
                &mut harness,
                lp_signer,
                &usdc_mint,
                Some(&issuer_wallet.signer),
                *contribution,
            )?;
            lps.push(LiquidityProvider {
                wallet,
                planned_contribution: *contribution,
            });
        }

        Ok(Some(Self {
            harness,
            config,
            invoice_mint,
            usdc_mint,
            invoice_pda,
            usdc_vault,
            issuer: issuer_wallet,
            debtor: debtor_wallet,
            lps,
        }))
    }

    fn list_invoice(&mut self) -> TestResult {
        let terms = self.config.invoice_terms;
        let accounts = invo_fi::accounts::ListInvoice {
            issuer: to_anchor_pubkey(&self.issuer.pubkey()),
            invoice_account: to_anchor_pubkey(&self.invoice_pda),
            usdc_mint: to_anchor_pubkey(&self.usdc_mint),
            usdc_vault: to_anchor_pubkey(&self.usdc_vault),
            invoice_mint: to_anchor_pubkey(&self.invoice_mint),
            system_program: system_program_anchor_id(),
            token_program: anchor_spl::token::ID,
            rent: anchor_lang::solana_program::sysvar::rent::ID,
        };
        let ix = Instruction {
            program_id: self.harness.program_id(),
            accounts: convert_metas(accounts.to_account_metas(Some(true))),
            data: invo_fi::instruction::ListInvoice {
                total_amount: terms.total_amount,
                purchase_price: terms.purchase_price,
                due_date: terms.due_date,
                risk_rating: terms.risk_rating,
            }
            .data(),
        };
        self.harness.send(ix, &self.issuer.signer)
    }

    fn contribute_all(&mut self) -> TestResult {
        for lp in &self.lps {
            let accounts = invo_fi::accounts::Contribute {
                contributor: to_anchor_pubkey(&lp.wallet.pubkey()),
                contributor_usdc_account: to_anchor_pubkey(&lp.wallet.usdc_account),
                invoice_account: to_anchor_pubkey(&self.invoice_pda),
                usdc_vault: to_anchor_pubkey(&self.usdc_vault),
                token_program: anchor_spl::token::ID,
            };
            let ix = Instruction {
                program_id: self.harness.program_id(),
                accounts: convert_metas(accounts.to_account_metas(Some(true))),
                data: invo_fi::instruction::Contribute {
                    amount: lp.planned_contribution,
                }
                .data(),
            };
            self.harness.send(ix, &lp.wallet.signer)?;
        }
        Ok(())
    }

    fn claim_funding(&mut self) -> TestResult {
        let accounts = invo_fi::accounts::ClaimFunding {
            issuer: to_anchor_pubkey(&self.issuer.pubkey()),
            issuer_usdc_account: to_anchor_pubkey(&self.issuer.usdc_account),
            invoice_account: to_anchor_pubkey(&self.invoice_pda),
            usdc_vault: to_anchor_pubkey(&self.usdc_vault),
            token_program: anchor_spl::token::ID,
        };
        let ix = Instruction {
            program_id: self.harness.program_id(),
            accounts: convert_metas(accounts.to_account_metas(Some(true))),
            data: invo_fi::instruction::ClaimFunding {}.data(),
        };
        self.harness.send(ix, &self.issuer.signer)
    }

    fn repay_full(&mut self) -> TestResult {
        let contributor_accounts: Vec<Pubkey> = self
            .lps
            .iter()
            .map(|lp| lp.wallet.usdc_account)
            .collect();

        let accounts = invo_fi::accounts::RepayAndDistribute {
            payer: to_anchor_pubkey(&self.debtor.pubkey()),
            payer_usdc_account: to_anchor_pubkey(&self.debtor.usdc_account),
            invoice_account: to_anchor_pubkey(&self.invoice_pda),
            usdc_vault: to_anchor_pubkey(&self.usdc_vault),
            token_program: anchor_spl::token::ID,
        };
        let mut metas = convert_metas(accounts.to_account_metas(Some(true)));
        metas.push(AccountMeta::new_readonly(
            to_solana_pubkey(&token::ID),
            false,
        ));
        metas.push(AccountMeta::new(self.usdc_vault, false));
        metas.push(AccountMeta::new_readonly(self.invoice_pda, false));
        for acc in contributor_accounts {
            metas.push(AccountMeta::new(acc, false));
        }

        let ix = Instruction {
            program_id: self.harness.program_id(),
            accounts: metas,
            data: invo_fi::instruction::RepayAndDistribute {}.data(),
        };
        self.harness.send(ix, &self.debtor.signer)
    }

    fn invoice_state(&self) -> Invoice {
        let account = self
            .harness
            .account(&self.invoice_pda)
            .expect("invoice must exist");
        let mut data_slice: &[u8] = account.data.as_slice();
        Invoice::try_deserialize(&mut data_slice).expect("invoice deserialize")
    }

    fn token_amount(&self, account: &Pubkey) -> u64 {
        get_spl_account::<TokenAccount>(self.harness.svm(), account)
            .expect("token account")
            .amount
    }
}

fn create_wallet_with_tokens(
    harness: &mut TestHarness,
    signer: Keypair,
    mint: &Pubkey,
    mint_authority: Option<&Keypair>,
    initial_amount: u64,
) -> TestResult<ActorWallet> {
    let token_account = TokenCreateAccount::new(harness.svm_mut(), &signer, mint)
        .owner(&signer.pubkey())
        .send()
        .map_err(|err| io::Error::new(io::ErrorKind::Other, format!("create token account failed: {err:?}")))?;

    if initial_amount > 0 {
        let authority = mint_authority.unwrap_or(&signer);
        MintTo::new(harness.svm_mut(), authority, mint, &token_account, initial_amount)
            .owner(authority)
            .send()
            .map_err(|err| io::Error::new(io::ErrorKind::Other, format!("mint_to failed: {err:?}")))?;
    }

    Ok(ActorWallet {
        signer,
        usdc_account: token_account,
    })
}

#[test]
fn list_invoice_initializes_state() -> TestResult {
    let config = ScenarioConfig::default();
    let Some(mut fixture) = InvoiceFixture::setup(config)? else {
        return Ok(());
    };

    fixture.list_invoice()?;

    let invoice = fixture.invoice_state();
    let terms = fixture.config.invoice_terms;
    assert_eq!(invoice.issuer, to_anchor_pubkey(&fixture.issuer.pubkey()));
    assert_eq!(invoice.total_amount, terms.total_amount);
    assert_eq!(invoice.purchase_price, terms.purchase_price);
    assert_eq!(invoice.due_date, terms.due_date);
    assert_eq!(invoice.risk_rating, terms.risk_rating);
    assert_eq!(invoice.status, InvoiceStatus::Funding as u8);
    assert_eq!(invoice.total_funded_amount, 0);
    assert_eq!(invoice.contributor_count, 0);

    let vault = fixture
        .harness
        .account(&fixture.usdc_vault)
        .expect("vault exists");
    assert_eq!(vault.owner, to_solana_pubkey(&token::ID));

    Ok(())
}

#[test]
fn full_finance_and_repayment_flow() -> TestResult {
    let config = ScenarioConfig::default()
        .with_lp_contributions(vec![600_000, 400_000])
        .with_terms(InvoiceTerms {
            total_amount: 1_200_000,
            purchase_price: 1_000_000,
            ..InvoiceTerms::default()
        })
        .with_debtor_balance(1_200_000);

    let Some(mut fixture) = InvoiceFixture::setup(config)? else {
        return Ok(());
    };

    fixture.list_invoice()?;
    fixture.contribute_all()?;
    fixture.claim_funding()?;
    fixture.repay_full()?;

    let invoice = fixture.invoice_state();
    assert_eq!(invoice.status, InvoiceStatus::Repaid as u8);

    let issuer_balance = fixture.token_amount(&fixture.issuer.usdc_account);
    assert_eq!(issuer_balance, fixture.config.invoice_terms.purchase_price);

    let lp_balances: Vec<u64> = fixture
        .lps
        .iter()
        .map(|lp| fixture.token_amount(&lp.wallet.usdc_account))
        .collect();
    assert_eq!(lp_balances[0], 720_000);
    assert_eq!(lp_balances[1], 480_000);

    Ok(())
}

