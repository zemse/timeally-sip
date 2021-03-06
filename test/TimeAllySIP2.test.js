/*
  Author: Soham Zemse (https://github.com/zemse)

  In this file you should write tests for your smart contract as you progress in developing your smart contract. For reference of Mocha testing framework, you can check out https://devdocs.io/mocha/.
*/

/// @dev importing packages required
const assert = require('assert');
const ethers = require('ethers');
const ganache = require('ganache-cli');

/// @dev initialising development blockchain
const provider = new ethers.providers.Web3Provider(ganache.provider({ gasLimit: 8000000 }));

/// @dev helper function
const _convertDataToHex = (data, index = 0) => {
  return '0x'+data.slice(2+64*index, 2+64*(index+1));
}

/// @dev importing build file
const esJson = require('../build/Eraswap_ERC20Basic.json');
const timeallySIPJSON = require('../build/TimeAllySIP_TimeAllySIP.json');

const EARTH_SECONDS_IN_MONTH = 2629744;
let evm_increasedTime = 0;
/// @dev initialize global variables
let accounts
, esInstance = []
, timeallySIPInstance = [];


const sipPlans = [
  {
    minimumMonthlyCommitmentAmount: ethers.utils.parseEther('500'),
    accumulationPeriodMonths: 12,
    benefitPeriodYears: 9,
    gracePeriodSeconds: 864000, /// 10 days
    monthlyBenefitFactor: 200,
    gracePenaltyFactor: 10,
    defaultPenaltyFactor: 20
  }
];
let diff = 0;
const safeDeposit = (seconds, add = 0) => {
  diff += add;
  return seconds - diff + add;
};
const depositTestCases = [
  // [
  //   safeDeposit(EARTH_SECONDS_IN_MONTH),
  //   '600',
  //   1
  // ],
  // [
  //   0,
  //   '1000',
  //   1,
  //   'fail'
  // ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '1000',
    2
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    3
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    4
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    5
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    6
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    7
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    8
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    9
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    10
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    11
  ],
  [
    safeDeposit(EARTH_SECONDS_IN_MONTH),
    '500',
    12
  ],
  // [
  //   safeDeposit(EARTH_SECONDS_IN_MONTH),
  //   '600',
  //   13
  // ],
];


/// @dev this is a test case collection
describe('Ganache Setup', async() => {

  /// @dev this is a test case. You first fetch the present state, and compare it with an expectation. If it satisfies the expectation, then test case passes else an error is thrown.
  it('initiates ganache and generates a bunch of demo accounts', async() => {

    /// @dev for example in this test case we are fetching accounts array.
    accounts = await provider.listAccounts();

    /// @dev then we have our expection that accounts array should be at least having 1 accounts
    assert.ok(accounts.length >= 1, 'atleast 2 accounts should be present in the array');
  });
});

describe('Eraswap Setup', () => {
  it('deploys Eraswap ERC20 contract from first account', async() => {

    /// @dev you create a contract factory for deploying contract. Refer to ethers.js documentation at https://docs.ethers.io/ethers.js/html/
    const EraswapContractFactory = new ethers.ContractFactory(
      esJson.abi,
      esJson.evm.bytecode.object,
      provider.getSigner(accounts[0])
    );
    esInstance[0] =  await EraswapContractFactory.deploy();

    assert.ok(esInstance[0].address, 'conract address should be present');
  });
});

/// @dev this is another test case collection
describe('TimeAllySIP Contract Nominee', () => {

  /// @dev describe under another describe is a sub test case collection
  describe('TimeAllySIP Setup', async() => {

    /// @dev this is first test case of this collection
    it('deploys TimeAllySIP contract from first account with Eraswap contract address', async() => {

      /// @dev you create a contract factory for deploying contract. Refer to ethers.js documentation at https://docs.ethers.io/ethers.js/html/
      const TimeAllySIPContractFactory = new ethers.ContractFactory(
        timeallySIPJSON.abi,
        timeallySIPJSON.evm.bytecode.object,
        provider.getSigner(accounts[0])
      );
      timeallySIPInstance[0] =  await TimeAllySIPContractFactory.deploy(esInstance[0].address);

      assert.ok(timeallySIPInstance[0].address, 'conract address should be present');
    });

    it('set a plan of TimeAllySIP', async() => {
      const args = sipPlans[0];
      const tx = await timeallySIPInstance[0].functions.createSIPPlan(
        ...Object.values(args)
      );
      await tx.wait();

      const sipPlan = await timeallySIPInstance[0].functions.sipPlans(0);
      // console.log(sipPlan);
      assert.ok(
        sipPlan.minimumMonthlyCommitmentAmount.eq(args.minimumMonthlyCommitmentAmount),
        'minimumMonthlyCommitmentAmount should be set properly'
      );
      assert.ok(
        sipPlan.accumulationPeriodMonths.eq(args.accumulationPeriodMonths),
        'accumulationPeriodMonths should be set properly'
      );
      assert.ok(
        sipPlan.benefitPeriodYears.eq(args.benefitPeriodYears),
        'benefitPeriodYears should be set properly'
      );
      assert.ok(
        sipPlan.gracePeriodSeconds.eq(args.gracePeriodSeconds),
        'gracePeriodSeconds should be set properly'
      );
      assert.ok(
        sipPlan.monthlyBenefitFactor.eq(args.monthlyBenefitFactor),
        'onTimeBenefitFactor should be set properly'
      );
      assert.ok(
        sipPlan.gracePenaltyFactor.eq(args.gracePenaltyFactor),
        'graceBenefitFactor should be set properly'
      );
      assert.ok(
        sipPlan.defaultPenaltyFactor.eq(args.defaultPenaltyFactor),
        'topupBenefitFactor should be set properly'
      );

    });
  });

  describe('TimeAllySIP Functionality', async() => {

    describe('New TimeAlly SIP', async() => {
      it('deployer sends 10,000 ES to account 1', async() => {
        const tx = await esInstance[0].functions.transfer(
          accounts[1],
          ethers.utils.parseEther('10000')
        );

        await tx.wait();

        const balanceOf1 = await esInstance[0].balanceOf(accounts[1]);

        assert.ok(balanceOf1.eq(ethers.utils.parseEther('10000')), 'account 1 should get 10,000 ES');
      });

      it('deployer sends 10,000 ES to account 2', async() => {
        const tx = await esInstance[0].functions.transfer(
          accounts[2],
          ethers.utils.parseEther('10000')
        );

        await tx.wait();

        const balanceOf2 = await esInstance[0].balanceOf(accounts[2]);

        assert.ok(balanceOf2.eq(ethers.utils.parseEther('10000')), 'account 2 should get 10,000 ES');
      });

      it('account 1 gives allowance of 500 ES to TimeAllySIP Contract', async() => {
        esInstance[1] = new ethers.Contract(
          esInstance[0].address,
          esJson.abi,
          provider.getSigner(accounts[1])
        );

        const tx = await esInstance[1].functions.approve(timeallySIPInstance[0].address, ethers.utils.parseEther('500'));
        await tx.wait();

        const allowanceToSip = await esInstance[1].functions.allowance(accounts[1], timeallySIPInstance[0].address);

        assert.ok(allowanceToSip.eq(ethers.utils.parseEther('500')), 'allowance should be set');
      });

      it('account 1 tries to create an SIP of 500 ES monthly commitment', async() => {
        timeallySIPInstance[1] = new ethers.Contract(
          timeallySIPInstance[0].address,
          timeallySIPJSON.abi,
          provider.getSigner(accounts[1])
        );

        const beforeBalanceOf1 = await esInstance[0].balanceOf(accounts[1]);
        const tx = await timeallySIPInstance[1].functions.newSIP(0, ethers.utils.parseEther('500'));
        await tx.wait();

        const afterBalanceOf1 = await esInstance[0].balanceOf(accounts[1]);

        assert.ok(
          beforeBalanceOf1
          .sub(afterBalanceOf1)
          .eq(ethers.utils.parseEther('500')),
          'amount subtracted from account 1 should be 500'
        );

        // for(i = 0; i <= 11; i++) {
        //   console.log(i, ethers.utils.formatEther(await timeallySIPInstance[1].functions.monthlyBenefitAmount(accounts[1], 0, i)));
        // }

        /// add checks for sip details too.
      });
    });

    describe('Nominee', async() => {
      it('assign a nominee', async() => {
        const nominationBefore = await timeallySIPInstance[1].functions.viewNomination(accounts[1], 0, accounts[2]);

        assert.ok(!nominationBefore, 'nomination should not be there before');

        const tx = await timeallySIPInstance[1].functions.toogleNominee(0, accounts[2], true);
        await tx.wait();

        const nominationAfter = await timeallySIPInstance[1].functions.viewNomination(accounts[1], 0, accounts[2]);

        /// @dev activating 2nd account instance
        esInstance[2] = new ethers.Contract(
          esInstance[0].address,
          esJson.abi,
          provider.getSigner(accounts[2])
        );
        timeallySIPInstance[2] = new ethers.Contract(
          timeallySIPInstance[0].address,
          timeallySIPJSON.abi,
          provider.getSigner(accounts[2])
        );

        assert.ok(nominationAfter, 'nomination should be there now');
      });
    });

    describe('Nominee Continues TimeAlly SIP deposits', async() => {
      depositTestCases.forEach(entry => {
        const [increaseSeconds, amountInES, monthId, fail] = entry;
        describe(`Nominee Deposit of Month ${monthId}`, async() => {
          if(increaseSeconds) {
            it(`time travels to future by ${increaseSeconds} seconds`, async() => {
              evm_increasedTime += increaseSeconds;
              const timeIncreased = await provider.send('evm_increaseTime', [increaseSeconds]);

              assert.equal(timeIncreased, evm_increasedTime, 'increase in time should be one month');
            });
          }

          it(`account 2 gives allowance of ${amountInES} ES to TimeAlly SIP contract`, async() => {
            const tx = await esInstance[2].functions.approve(timeallySIPInstance[0].address, ethers.utils.parseEther(amountInES));
            await tx.wait();

            const allowanceToSip = await esInstance[2].functions.allowance(accounts[2], timeallySIPInstance[0].address);

            assert.ok(allowanceToSip.eq(ethers.utils.parseEther(amountInES)), 'allowance should be set');
          });

          it(`account 2 depositing ${amountInES} ES in SIP month ${monthId} for account 1${fail ? ` should give error` : ''}`, async() => {
            try {
              /// @dev account 2 depositing for account 1
              const depositStatus = await timeallySIPInstance[2].functions.getDepositStatus(
                accounts[1], 0, monthId
              );
              const actualDepositAmountBN = ethers.utils.parseEther(amountInES);
              const tx = await timeallySIPInstance[2].functions.monthlyDeposit(
                accounts[1], 0, actualDepositAmountBN, monthId
              );
              const txReceipt = await tx.wait();
              const log = txReceipt.logs[1];
              // console.log(log);
              const depositAmount = ethers.utils.bigNumberify(_convertDataToHex(log.data, 1));
              const yearlyBenefit = ethers.utils.bigNumberify(_convertDataToHex(log.data, 2));

              console.log("\x1b[2m",
                `        depositStatus: ${Number(depositStatus._hex)}\n`,
                `        monthId: ${monthId}\n`,
                `        deposit amount: ${ethers.utils.formatEther(depositAmount)}\n`,
                `        yearly benefit queued: ${ethers.utils.formatEther(yearlyBenefit)}`
              );
              for(i = 0; i <= 16; i++) {
                console.log("\x1b[2m",i, String(await timeallySIPInstance[2].functions.getDepositDoneStatus(accounts[1], 0, i)));
              }
            } catch (error) {
              console.log(error.message);
              assert(fail);
            }
          });
          it('owner deposits amount pending for deposit', async() => {
            const pendingBenefit = await timeallySIPInstance[0].functions.pendingBenefitAmountOfAllStakers();
            const fundsDeposit = await timeallySIPInstance[0].functions.fundsDeposit();

            const diff = pendingBenefit.sub(fundsDeposit);

            console.log("\x1b[2m",
              `        Owner has to deposit ${ethers.utils.formatEther(diff)} ES to SIP contract`
            );

            let tx = await esInstance[0].functions.approve(timeallySIPInstance[0].address, diff);
            await tx.wait();

            tx = await timeallySIPInstance[0].functions.addFunds(diff);
            await tx.wait();

            const fundsDepositUpdated = await timeallySIPInstance[0].functions.fundsDeposit();

            assert.ok(fundsDepositUpdated.eq(pendingBenefit), 'funds deposit should be updated');
          });
        });
      });
    });

    describe('TimeAlly SIP Withdrawls', async() => {
      const monthsToIncrease = 1;
      increaseSeconds = EARTH_SECONDS_IN_MONTH*monthsToIncrease;

      it(`time travels to future by 1 year`, async() => {
        const increaseSeconds = EARTH_SECONDS_IN_MONTH * 12;
        evm_increasedTime += increaseSeconds;
        const timeIncreased = await provider.send('evm_increaseTime', [increaseSeconds]);

        assert.equal(timeIncreased, evm_increasedTime, 'increase in time should be one month');
      });

      for(let i = 1; i <= 108; i+=monthsToIncrease) {
        describe(`Nominee Withdrawl for Month ${i}`, async() => {
          it(`time travels to future by ${increaseSeconds} seconds`, async() => {
            evm_increasedTime += increaseSeconds;
            const timeIncreased = await provider.send('evm_increaseTime', [increaseSeconds]);

            assert.equal(timeIncreased, evm_increasedTime, 'increase in time should be one month');
          });

          it(`Nominee Get withdrawl for monthId ${i}`, async() => {
            const benefit = await timeallySIPInstance[2].functions.getPendingWithdrawlAmount(
              accounts[1], 0, i, false
            );
            console.log(
              "\x1b[2m",
              `        Benefit Amount for Month ${i}: ${ethers.utils.formatEther(benefit)} ES`
            );
            const balanceOld = await esInstance[0].functions.balanceOf(accounts[2]);
            const tx = await timeallySIPInstance[2].functions.withdrawBenefit(
              accounts[1], 0, i
            );
            const txReceipt = await tx.wait();
            const balanceNew = await esInstance[0].functions.balanceOf(accounts[2]);
            assert.ok(balanceNew.gt(balanceOld), 'balance should increase');
            // console.log(txReceipt);
          });
        });

        if((i)%36 === 0) {
          describe('PowerBoosterWithdrawl', async() => {
            it(`Get power booster withdrawl on monthId ${i}`, async() => {
              const balanceOld = await esInstance[0].functions.balanceOf(accounts[2]);

              const sip = await timeallySIPInstance[2].functions.sips(accounts[1], 0);

              const calculatePowerBooster = await timeallySIPInstance[2].functions.calculatePowerBooster(
                accounts[1], 0, +sip.powerBoosterWithdrawls + 1
              );

              // console.log('calculatePowerBooster', calculatePowerBooster);

              const tx = await timeallySIPInstance[2].functions.withdrawPowerBooster(
                accounts[1], 0
              );
              const txReceipt = await tx.wait();
              const balanceNew = await esInstance[0].functions.balanceOf(accounts[2]);
              console.log(
                "\x1b[2m",
                `        PowerBooster calculated for ${i}: ${ethers.utils.formatEther(calculatePowerBooster)} ES\n`,
                `        PowerBooster received on ${i}: ${ethers.utils.formatEther(balanceNew.sub(balanceOld))} ES`
              );
              assert.ok(balanceNew.gt(balanceOld), 'balance should increase');
              // console.log(txReceipt);
            });
          });
        }

      }
    });

  });
});
