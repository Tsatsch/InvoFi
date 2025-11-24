use anchor_lang::{
    solana_program::{
        instruction::AccountMeta as AnchorAccountMeta, program_pack::Pack, system_program,
    },
    AccountDeserialize, InstructionData, ToAccountMetas,
};
use anchor_spl::token;
use anchor_spl::token::spl_token::state::{Account as SplTokenAccount, AccountState, Mint as SplMint};
use invo_fi::state::invoice::{Invoice, InvoiceStatus};
use litesvm::LiteSVM;
use solana_account::Account;
use solana_instruction::{account_meta::AccountMeta, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_pubkey::Pubkey;
use solana_signer::Signer;
use solana_transaction::Transaction;
use std::{error::Error, io, path::Path};

fn program_artifact_path() -> &'static str {
    concat!(env!("CARGO_MANIFEST_DIR"), "/../../target/deploy/invo_fi.so")
}

fn program_id() -> Pubkey {
    Pubkey::new_from_array(invo_fi::ID.to_bytes())
}

fn to_anchor_pubkey(pubkey: &Pubkey) -> anchor_lang::solana_program::pubkey::Pubkey {
    anchor_lang::solana_program::pubkey::Pubkey::new_from_array(pubkey.to_bytes())
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

fn pack_mint_account(mint: SplMint) -> Vec<u8> {
    let mut data = vec![0u8; SplMint::LEN];
    SplMint::pack(mint, &mut data).unwrap();
    data
}

fn pack_token_account(account: SplTokenAccount) -> Vec<u8> {
    let mut data = vec![0u8; SplTokenAccount::LEN];
    SplTokenAccount::pack(account, &mut data).unwrap();
    data
}

fn create_mock_mint_account(
    svm: &mut LiteSVM,
    mint: Pubkey,
    mint_authority: Pubkey,
    decimals: u8,
) -> Result<(), Box<dyn Error>> {
    let rent = svm.minimum_balance_for_rent_exemption(SplMint::LEN);
    let mint_data = pack_mint_account(SplMint {
        mint_authority: anchor_lang::solana_program::program_option::COption::Some(
            to_anchor_pubkey(&mint_authority),
        ),
        supply: 1_000_000_000_000,
        decimals,
        is_initialized: true,
        freeze_authority: anchor_lang::solana_program::program_option::COption::None,
    });
    svm.set_account(
        mint,
        Account {
            lamports: rent,
            data: mint_data,
            owner: Pubkey::new_from_array(token::ID.to_bytes()),
            executable: false,
            rent_epoch: 0,
        },
    )
    .map_err(|err| format!("failed to set mint account: {err:?}"))?;
    Ok(())
}

fn create_mock_token_account(
    svm: &mut LiteSVM,
    account_pubkey: Pubkey,
    mint: Pubkey,
    owner: Pubkey,
    amount: u64,
) -> Result<(), Box<dyn Error>> {
    let rent = svm.minimum_balance_for_rent_exemption(SplTokenAccount::LEN);
    let account_data = pack_token_account(SplTokenAccount {
        mint: to_anchor_pubkey(&mint),
        owner: to_anchor_pubkey(&owner),
        amount,
        delegate: anchor_lang::solana_program::program_option::COption::None,
        state: AccountState::Initialized,
        is_native: anchor_lang::solana_program::program_option::COption::None,
        delegated_amount: 0,
        close_authority: anchor_lang::solana_program::program_option::COption::None,
    });
    svm.set_account(
        account_pubkey,
        Account {
            lamports: rent,
            data: account_data,
            owner: Pubkey::new_from_array(token::ID.to_bytes()),
            executable: false,
            rent_epoch: 0,
        },
    )
    .map_err(|err| format!("failed to set token account: {err:?}"))?;
    Ok(())
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

fn request_airdrop(
    svm: &mut LiteSVM,
    recipient: &Pubkey,
    amount: u64,
) -> Result<(), Box<dyn Error>> {
    svm.airdrop(recipient, amount).map_err(|err| {
        io::Error::new(io::ErrorKind::Other, format!("airdrop failed: {err:?}"))
    })?;
    Ok(())
}

fn fetch_invoice(svm: &LiteSVM, invoice_pda: &Pubkey) -> Invoice {
    let account = svm
        .get_account(invoice_pda)
        .expect("invoice account must exist");
    let mut data_slice: &[u8] = account.data.as_slice();
    Invoice::try_deserialize(&mut data_slice).expect("invoice deserialize")
}

fn list_invoice_ix(
    program_id: Pubkey,
    issuer: &Keypair,
    invoice_pda: Pubkey,
    usdc_mint: Pubkey,
    usdc_vault: Pubkey,
    invoice_mint: Pubkey,
    total_amount: u64,
    purchase_price: u64,
    due_date: i64,
    risk_rating: u8,
) -> Instruction {
    let accounts = invo_fi::accounts::ListInvoice {
        issuer: to_anchor_pubkey(&issuer.pubkey()),
        invoice_account: to_anchor_pubkey(&invoice_pda),
        usdc_mint: to_anchor_pubkey(&usdc_mint),
        usdc_vault: to_anchor_pubkey(&usdc_vault),
        invoice_mint: to_anchor_pubkey(&invoice_mint),
        system_program: system_program::ID,
        token_program: anchor_spl::token::ID,
        rent: anchor_lang::solana_program::sysvar::rent::ID,
    };
    Instruction {
        program_id,
        accounts: convert_metas(accounts.to_account_metas(Some(true))),
        data: invo_fi::instruction::ListInvoice {
            total_amount,
            purchase_price,
            due_date,
            risk_rating,
        }
        .data(),
    }
}

fn contribute_ix(
    program_id: Pubkey,
    contributor: &Keypair,
    invoice_pda: Pubkey,
    contributor_usdc: Pubkey,
    usdc_vault: Pubkey,
    amount: u64,
) -> Instruction {
    let accounts = invo_fi::accounts::Contribute {
        contributor: to_anchor_pubkey(&contributor.pubkey()),
        contributor_usdc_account: to_anchor_pubkey(&contributor_usdc),
        invoice_account: to_anchor_pubkey(&invoice_pda),
        usdc_vault: to_anchor_pubkey(&usdc_vault),
        token_program: anchor_spl::token::ID,
    };
    Instruction {
        program_id,
        accounts: convert_metas(accounts.to_account_metas(Some(true))),
        data: invo_fi::instruction::Contribute { amount }.data(),
    }
}

fn claim_funding_ix(
    program_id: Pubkey,
    issuer: &Keypair,
    invoice_pda: Pubkey,
    issuer_usdc: Pubkey,
    usdc_vault: Pubkey,
) -> Instruction {
    let accounts = invo_fi::accounts::ClaimFunding {
        issuer: to_anchor_pubkey(&issuer.pubkey()),
        issuer_usdc_account: to_anchor_pubkey(&issuer_usdc),
        invoice_account: to_anchor_pubkey(&invoice_pda),
        usdc_vault: to_anchor_pubkey(&usdc_vault),
        token_program: anchor_spl::token::ID,
    };
    Instruction {
        program_id,
        accounts: convert_metas(accounts.to_account_metas(Some(true))),
        data: invo_fi::instruction::ClaimFunding {}.data(),
    }
}

fn repay_and_distribute_ix(
    program_id: Pubkey,
    payer: &Keypair,
    invoice_pda: Pubkey,
    payer_usdc: Pubkey,
    usdc_vault: Pubkey,
    contributor_accounts: &[Pubkey],
) -> Instruction {
    let accounts = invo_fi::accounts::RepayAndDistribute {
        payer: to_anchor_pubkey(&payer.pubkey()),
        payer_usdc_account: to_anchor_pubkey(&payer_usdc),
        invoice_account: to_anchor_pubkey(&invoice_pda),
        usdc_vault: to_anchor_pubkey(&usdc_vault),
        token_program: anchor_spl::token::ID,
    };
    let mut metas = convert_metas(accounts.to_account_metas(Some(true)));
    metas.push(AccountMeta::new_readonly(
        Pubkey::new_from_array(token::ID.to_bytes()),
        false,
    ));
    metas.push(AccountMeta::new(usdc_vault, false));
    metas.push(AccountMeta::new_readonly(invoice_pda, false));
    for account in contributor_accounts {
        metas.push(AccountMeta::new(*account, false));
    }

    Instruction {
        program_id,
        accounts: metas,
        data: invo_fi::instruction::RepayAndDistribute {}.data(),
    }
}

fn send_ix(
    svm: &mut LiteSVM,
    ix: Instruction,
    signer: &Keypair,
) -> Result<(), Box<dyn Error>> {
    let blockhash = svm.latest_blockhash();
    let message = Message::new(&[ix], Some(&signer.pubkey()));
    let mut tx = Transaction::new_unsigned(message);
    tx.sign(&[signer], blockhash);
    if let Err(err) = svm.send_transaction(tx) {
        return Err(Box::new(io::Error::new(
            io::ErrorKind::Other,
            format!("transaction failed: {err:?}"),
        )));
    }
    Ok(())
}

#[test]
fn list_invoice_initializes_state() -> Result<(), Box<dyn Error>> {
    let mut svm = match load_program_or_skip() {
        Some(vm) => vm,
        None => return Ok(()),
    };

    let program_id = program_id();
    let issuer = Keypair::new();
    request_airdrop(&mut svm, &issuer.pubkey(), 5_000_000_000)?;

    let invoice_mint = Pubkey::new_unique();
    let usdc_mint = Pubkey::new_unique();
    create_mock_mint_account(&mut svm, invoice_mint, issuer.pubkey(), 0)?;
    create_mock_mint_account(&mut svm, usdc_mint, issuer.pubkey(), 6)?;

    let (invoice_pda, _) =
        Pubkey::find_program_address(&[b"invoice", invoice_mint.as_ref()], &program_id);
    let (usdc_vault, _) =
        Pubkey::find_program_address(&[b"vault", invoice_pda.as_ref()], &program_id);

    let total_amount = 1_200_000;
    let purchase_price = 1_000_000;
    let due_date = 1_700_000_000;
    let risk_rating = 3;

    let ix = list_invoice_ix(
        program_id,
        &issuer,
        invoice_pda,
        usdc_mint,
        usdc_vault,
        invoice_mint,
        total_amount,
        purchase_price,
        due_date,
        risk_rating,
    );
    send_ix(&mut svm, ix, &issuer)?;

    let invoice = fetch_invoice(&svm, &invoice_pda);
    assert_eq!(invoice.issuer, to_anchor_pubkey(&issuer.pubkey()));
    assert_eq!(invoice.total_amount, total_amount);
    assert_eq!(invoice.purchase_price, purchase_price);
    assert_eq!(invoice.due_date, due_date);
    assert_eq!(invoice.risk_rating, risk_rating);
    assert_eq!(invoice.status, InvoiceStatus::Funding as u8);
    assert_eq!(invoice.total_funded_amount, 0);
    assert_eq!(invoice.contributor_count, 0);

    let vault_account = svm
        .get_account(&usdc_vault)
        .expect("vault must exist after list");
    let spl = SplTokenAccount::unpack(&vault_account.data).unwrap();
    assert_eq!(spl.amount, 0);
    assert_eq!(spl.owner, to_anchor_pubkey(&invoice_pda));

    Ok(())
}

#[test]
fn full_finance_and_repayment_flow() -> Result<(), Box<dyn Error>> {
    let mut svm = match load_program_or_skip() {
        Some(vm) => vm,
        None => return Ok(()),
    };

    let program_id = program_id();
    let issuer = Keypair::new();
    let lp_a = Keypair::new();
    let lp_b = Keypair::new();
    let debtor = Keypair::new();

    for kp in [&issuer, &lp_a, &lp_b, &debtor] {
        request_airdrop(&mut svm, &kp.pubkey(), 5_000_000_000)?;
    }

    let invoice_mint = Pubkey::new_unique();
    let usdc_mint = Pubkey::new_unique();
    create_mock_mint_account(&mut svm, invoice_mint, issuer.pubkey(), 0)?;
    create_mock_mint_account(&mut svm, usdc_mint, issuer.pubkey(), 6)?;

    let (invoice_pda, _) =
        Pubkey::find_program_address(&[b"invoice", invoice_mint.as_ref()], &program_id);
    let (usdc_vault, _) =
        Pubkey::find_program_address(&[b"vault", invoice_pda.as_ref()], &program_id);

    let issuer_usdc = Pubkey::new_unique();
    let lp_a_usdc = Pubkey::new_unique();
    let lp_b_usdc = Pubkey::new_unique();
    let debtor_usdc = Pubkey::new_unique();
    create_mock_token_account(&mut svm, issuer_usdc, usdc_mint, issuer.pubkey(), 0)?;
    create_mock_token_account(&mut svm, lp_a_usdc, usdc_mint, lp_a.pubkey(), 600_000)?;
    create_mock_token_account(&mut svm, lp_b_usdc, usdc_mint, lp_b.pubkey(), 400_000)?;
    create_mock_token_account(&mut svm, debtor_usdc, usdc_mint, debtor.pubkey(), 1_200_000)?;

    let total_amount = 1_200_000;
    let purchase_price = 1_000_000;

    let list_ix = list_invoice_ix(
        program_id,
        &issuer,
        invoice_pda,
        usdc_mint,
        usdc_vault,
        invoice_mint,
        total_amount,
        purchase_price,
        1_700_000_000,
        4,
    );
    send_ix(&mut svm, list_ix, &issuer)?;

    let contribute_a = contribute_ix(
        program_id,
        &lp_a,
        invoice_pda,
        lp_a_usdc,
        usdc_vault,
        600_000,
    );
    send_ix(&mut svm, contribute_a, &lp_a)?;
    let contribute_b = contribute_ix(
        program_id,
        &lp_b,
        invoice_pda,
        lp_b_usdc,
        usdc_vault,
        400_000,
    );
    send_ix(&mut svm, contribute_b, &lp_b)?;

    let invoice_after_funding = fetch_invoice(&svm, &invoice_pda);
    assert_eq!(invoice_after_funding.total_funded_amount, purchase_price);
    assert_eq!(invoice_after_funding.status, InvoiceStatus::Financed as u8);
    assert_eq!(invoice_after_funding.contributor_count, 2);

    let claim_ix = claim_funding_ix(
        program_id,
        &issuer,
        invoice_pda,
        issuer_usdc,
        usdc_vault,
    );
    send_ix(&mut svm, claim_ix, &issuer)?;

    let issuer_account = svm.get_account(&issuer_usdc).unwrap();
    let issuer_token = SplTokenAccount::unpack(&issuer_account.data).unwrap();
    assert_eq!(issuer_token.amount, purchase_price);

    let vault_post_claim = svm.get_account(&usdc_vault).unwrap();
    let vault_token = SplTokenAccount::unpack(&vault_post_claim.data).unwrap();
    assert_eq!(vault_token.amount, 0);

    let repay_ix = repay_and_distribute_ix(
        program_id,
        &debtor,
        invoice_pda,
        debtor_usdc,
        usdc_vault,
        &[lp_a_usdc, lp_b_usdc],
    );
    send_ix(&mut svm, repay_ix, &debtor)?;

    let invoice_final = fetch_invoice(&svm, &invoice_pda);
    assert_eq!(invoice_final.status, InvoiceStatus::Repaid as u8);

    let lp_a_account = svm.get_account(&lp_a_usdc).unwrap();
    let lp_a_token = SplTokenAccount::unpack(&lp_a_account.data).unwrap();
    assert_eq!(lp_a_token.amount, 600_000 + 120_000);

    let lp_b_account = svm.get_account(&lp_b_usdc).unwrap();
    let lp_b_token = SplTokenAccount::unpack(&lp_b_account.data).unwrap();
    assert_eq!(lp_b_token.amount, 400_000 + 80_000);

    Ok(())
}

