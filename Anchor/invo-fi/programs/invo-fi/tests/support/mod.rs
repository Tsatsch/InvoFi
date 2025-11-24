use std::{error::Error, io, path::Path};

use anchor_lang::{
    solana_program::instruction::AccountMeta as AnchorAccountMeta, AccountDeserialize,
    InstructionData, ToAccountMetas,
};
use anchor_spl::token;
use invo_fi::{error::InvoiceError, state::invoice::Invoice};
use litesvm::{
    types::{FailedTransactionMetadata, TransactionMetadata},
    LiteSVM,
};
use litesvm_token::{
    get_spl_account, spl_token::state::Account as TokenAccount,
    CreateAccount as TokenCreateAccount, CreateMint, MintTo,
};
use solana_account::Account;
use solana_instruction::{account_meta::AccountMeta, error::InstructionError, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_sdk_ids::system_program;
use solana_signer::Signer;
use solana_transaction::Transaction;
use solana_transaction_error::TransactionError;

pub type TestResult<T = ()> = Result<T, Box<dyn Error>>;

const DEFAULT_AIRDROP_LAMPORTS: u64 = 5_000_000_000;
pub const DEFAULT_DEBTOR_USDC_BALANCE: u64 = 2_000_000_000;
pub const USDC_DECIMALS: u8 = 6;

fn tx_error(err: FailedTransactionMetadata) -> io::Error {
    io::Error::new(
        io::ErrorKind::Other,
        format!("transaction failed: {:?}", err.err),
    )
}

fn program_artifact_path() -> &'static str {
    concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/../../target/deploy/invo_fi.so"
    )
}

pub fn program_id() -> Pubkey {
    Pubkey::new_from_array(invo_fi::ID.to_bytes())
}

pub fn to_anchor_pubkey(pubkey: &Pubkey) -> anchor_lang::solana_program::pubkey::Pubkey {
    anchor_lang::solana_program::pubkey::Pubkey::new_from_array(pubkey.to_bytes())
}

pub fn to_solana_pubkey(pubkey: &anchor_lang::solana_program::pubkey::Pubkey) -> Pubkey {
    Pubkey::new_from_array(pubkey.to_bytes())
}

pub fn system_program_anchor_id() -> anchor_lang::solana_program::pubkey::Pubkey {
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

pub fn assert_anchor_error(err: FailedTransactionMetadata, expected: InvoiceError) {
    match err.err {
        TransactionError::InstructionError(_, InstructionError::Custom(code)) => {
            assert_eq!(
                code,
                <InvoiceError as Into<u32>>::into(expected),
                "unexpected program error code"
            )
        }
        other => panic!("expected anchor custom error, got {other:?}"),
    }
}

pub struct TestHarness {
    svm: LiteSVM,
    program_id: Pubkey,
}

impl TestHarness {
    pub fn new() -> Option<Self> {
        let artifact = Path::new(program_artifact_path());
        if !artifact.exists() {
            eprintln!("Skipping test, missing {}", artifact.display());
            return None;
        }

        let mut svm = LiteSVM::new().with_default_programs();
        if let Err(err) = svm.add_program_from_file(program_id(), artifact) {
            eprintln!("Skipping test, could not load program: {err:?}");
            return None;
        }

        Some(Self {
            svm,
            program_id: program_id(),
        })
    }

    pub fn svm(&self) -> &LiteSVM {
        &self.svm
    }

    pub fn svm_mut(&mut self) -> &mut LiteSVM {
        &mut self.svm
    }

    pub fn program_id(&self) -> Pubkey {
        self.program_id
    }

    pub fn airdrop(&mut self, recipient: &Pubkey, amount: u64) -> TestResult {
        self.svm.airdrop(recipient, amount).map_err(|err| {
            io::Error::new(io::ErrorKind::Other, format!("airdrop failed: {err:?}"))
        })?;
        Ok(())
    }

    pub fn send_raw(
        &mut self,
        ix: Instruction,
        signer: &Keypair,
    ) -> Result<TransactionMetadata, FailedTransactionMetadata> {
        let blockhash = self.svm.latest_blockhash();
        let message = Message::new(&[ix], Some(&signer.pubkey()));
        let mut tx = Transaction::new_unsigned(message);
        tx.sign(&[signer], blockhash);
        self.svm.send_transaction(tx)
    }

    pub fn send(&mut self, ix: Instruction, signer: &Keypair) -> TestResult {
        self.send_raw(ix, signer)
            .map(|_| ())
            .map_err(|err| tx_error(err).into())
    }

    pub fn account(&self, key: &Pubkey) -> Option<Account> {
        self.svm.get_account(key)
    }
}

#[derive(Clone, Copy)]
pub struct InvoiceTerms {
    pub total_amount: u64,
    pub purchase_price: u64,
    pub due_date: i64,
    pub risk_rating: u8,
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
pub struct ScenarioConfig {
    pub invoice_terms: InvoiceTerms,
    pub lp_contributions: Vec<u64>,
    pub debtor_balance: u64,
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
    pub fn with_lp_contributions(mut self, contributions: Vec<u64>) -> Self {
        self.lp_contributions = contributions;
        self
    }

    pub fn with_terms(mut self, terms: InvoiceTerms) -> Self {
        self.invoice_terms = terms;
        self
    }

    pub fn with_debtor_balance(mut self, balance: u64) -> Self {
        self.debtor_balance = balance;
        self
    }
}

pub struct ActorWallet {
    pub signer: Keypair,
    pub usdc_account: Pubkey,
}

impl ActorWallet {
    pub fn pubkey(&self) -> Pubkey {
        self.signer.pubkey()
    }
}

pub struct LiquidityProvider {
    pub wallet: ActorWallet,
    pub planned_contribution: u64,
}

pub struct InvoiceFixture {
    pub harness: TestHarness,
    pub config: ScenarioConfig,
    pub invoice_mint: Pubkey,
    pub usdc_mint: Pubkey,
    pub invoice_pda: Pubkey,
    pub usdc_vault: Pubkey,
    pub issuer: ActorWallet,
    pub debtor: ActorWallet,
    pub lps: Vec<LiquidityProvider>,
}

impl InvoiceFixture {
    pub fn setup(config: ScenarioConfig) -> TestResult<Option<Self>> {
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
            .map_err(|err| {
                io::Error::new(
                    io::ErrorKind::Other,
                    format!("invoice mint failed: {err:?}"),
                )
            })?;

        let usdc_mint = CreateMint::new(harness.svm_mut(), &issuer)
            .authority(&issuer.pubkey())
            .decimals(USDC_DECIMALS)
            .send()
            .map_err(|err| {
                io::Error::new(io::ErrorKind::Other, format!("usdc mint failed: {err:?}"))
            })?;

        let (invoice_pda, _) = Pubkey::find_program_address(
            &[b"invoice", invoice_mint.as_ref()],
            &harness.program_id(),
        );
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

    pub fn list_invoice(&mut self) -> TestResult {
        self.list_invoice_with_terms_raw(self.config.invoice_terms)
            .map_err(tx_error)?;
        Ok(())
    }

    pub fn list_invoice_with_terms_raw(
        &mut self,
        terms: InvoiceTerms,
    ) -> Result<(), FailedTransactionMetadata> {
        let accounts = invo_fi::accounts::ListInvoice {
            issuer: to_anchor_pubkey(&self.issuer.pubkey()),
            invoice_account: to_anchor_pubkey(&self.invoice_pda),
            usdc_mint: to_anchor_pubkey(&self.usdc_mint),
            usdc_vault: to_anchor_pubkey(&self.usdc_vault),
            invoice_mint: to_anchor_pubkey(&self.invoice_mint),
            clock: anchor_lang::solana_program::sysvar::clock::ID,
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
        self.harness.send_raw(ix, &self.issuer.signer).map(|_| ())
    }

    pub fn contribute_all(&mut self) -> TestResult {
        for idx in 0..self.lps.len() {
            let amount = self.lps[idx].planned_contribution;
            self.contribute_lp_raw(idx, amount).map_err(tx_error)?;
        }
        Ok(())
    }

    pub fn contribute_lp_raw(
        &mut self,
        lp_index: usize,
        amount: u64,
    ) -> Result<(), FailedTransactionMetadata> {
        let lp = &self.lps[lp_index];
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
            data: invo_fi::instruction::Contribute { amount }.data(),
        };
        self.harness.send_raw(ix, &lp.wallet.signer).map(|_| ())
    }

    pub fn claim_funding(&mut self) -> TestResult {
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

    pub fn repay_full(&mut self) -> TestResult {
        let contributor_accounts: Vec<Pubkey> =
            self.lps.iter().map(|lp| lp.wallet.usdc_account).collect();

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

    pub fn invoice_state(&self) -> Invoice {
        let account = self
            .harness
            .account(&self.invoice_pda)
            .expect("invoice must exist");
        let mut data_slice: &[u8] = account.data.as_slice();
        Invoice::try_deserialize(&mut data_slice).expect("invoice deserialize")
    }

    pub fn token_amount(&self, account: &Pubkey) -> u64 {
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
        .map_err(|err| {
            io::Error::new(
                io::ErrorKind::Other,
                format!("create token account failed: {err:?}"),
            )
        })?;

    if initial_amount > 0 {
        let authority = mint_authority.unwrap_or(&signer);
        MintTo::new(
            harness.svm_mut(),
            authority,
            mint,
            &token_account,
            initial_amount,
        )
        .owner(authority)
        .send()
        .map_err(|err| io::Error::new(io::ErrorKind::Other, format!("mint_to failed: {err:?}")))?;
    }

    Ok(ActorWallet {
        signer,
        usdc_account: token_account,
    })
}
