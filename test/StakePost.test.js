// test/CryptoKombatCollection.test.js

const { accounts, contract } = require("@openzeppelin/test-environment");
const { expect } = require("chai");

// Import utilities from Test Helpers
const {
  BN,
  expectEvent,
  expectRevert,
  constants,
  time,
  ether,
  balance,
} = require("@openzeppelin/test-helpers");

const { Constants } = require("../src/constants");

const StakePost = contract.fromArtifact("StakePost");

const [owner, user1, user2, user3, feeCollector] = accounts;

const ZERO = new BN(0);
const ONE = new BN(1);
const FEE = new BN(100);
const NEGATIVE = new BN(-1);
const EXCEED_FEE = new BN(100000);
const ONE_ETHER = ether("1");
const POST_HASH =
  "0x7D5A99F603F231D53A4F39D1521F98D2E8BB279CF29BEBFD0687DC98458E7F89";

context("StakePost", async () => {
  let instance;

  before(async () => {
    instance = await StakePost.new({ from: owner });
  });

  describe("#contructor()", async () => {
    it("should set fee and feeCollector", async () => {
      expect(await instance.fee()).to.be.bignumber.eq(ZERO);
      expect(await instance.feeCollector()).to.be.eq(owner);
    });
  });

  describe("#updateFee()", async () => {
    it("owner can update fee", async () => {
      const receipt = await instance.updateFee(FEE, {
        from: owner,
      });

      expectEvent(receipt, "FeeUpdated", {
        fee: FEE,
      });

      expect(await instance.fee()).to.be.bignumber.eq(FEE);
    });

    it("non-owner can not update fee", async () => {
      await expectRevert(
        await instance.updateFee(FEE, {
          from: user1,
        }),
        "Ownable: caller is not the owner"
      );
    });

    it("cannot set exceed max fee", async () => {
      await expectRevert(
        await instance.updateFee(EXCEED_FEE, {
          from: owner,
        }),
        "StakePost: exceed max fee"
      );
    });
  });

  describe("#updateFeeCollector()", async () => {
    it("owner can update fee collector", async () => {
      const receipt = await instance.updateFeeCollector(feeCollector, {
        from: owner,
      });

      expectEvent(receipt, "FeeCollectorUpdated", {
        collector: feeCollector,
      });

      expect(await instance.feeCollector()).to.be.eq(feeCollector);
    });

    it("non-owner can not update fee collector", async () => {
      await expectRevert(
        await instance.updateFeeCollector(user1, {
          from: user1,
        }),
        "Ownable: caller is not the owner"
      );
    });

    it("cannot set zero address for fee collector", async () => {
      await expectRevert(
        await instance.updateFeeCollector(constants.ZERO_ADDRESS, {
          from: owner,
        }),
        "StakePost: zero collector address"
      );
    });
  });

  describe("#getStakepostIndexByUser()", async () => {
    it("returns negative when looking up non existent user", async () => {
      expect(await instance.getStakepostIndexByUser(user1)).to.be.bignumber.eq(
        NEGATIVE
      );
    });
  });

  describe("#stakeAndPost()", async () => {
    it("anyone can stake and post", async () => {
      const receipt = await instance.stakeAndPost(POST_HASH, {
        from: user1,
        value: ONE_ETHER,
      });

      expectEvent(receipt, "StakeAndPost", {
        user: user1,
        stake: ONE_ETHER,
        post: POST_HASH.toLowerCase(),
      });

      expect(await balance.current(instance.address)).to.be.bignumber.eq(
        ONE_ETHER
      );

      const post = await instance.posts(0);

      expect(post.user).to.be.eq(user1);
      expect(post.stake).to.be.bignumber.eq(ONE_ETHER);
      expect(post.post).to.be.eq(POST_HASH.toLowerCase());
      expect(post.time).to.be.bignumber.eq(await time.latest());
      //expect().to.be.eq(user1);
    });
  });

  describe("#exit()", async () => {
    it("user can exit", async () => {
      const start = await time.latest();
      const end = start.add(time.duration.hours(3));
      await time.increaseTo(end);

      const receipt = await instance.exit({
        from: user1,
      });

      expectEvent(receipt, "Exited", {
        user: user1,
      });
    });
  });

  // describe("#stakeAndPost()", async () => {
  //   it("cannot grab if not in users list", async () => {
  //     expectRevert(
  //       instance.grab({
  //         from: owner,
  //       }),
  //       "Airgrab: cannot grab zero amount"
  //     );
  //   });

  //   it("user can grab full amount", async () => {
  //     const receipt = await instance.grab({
  //       from: userA,
  //     });

  //     expect(await instance.balanceOf(userA)).to.be.bignumber.equal(
  //       ZERO_AMOUNT
  //     );

  //     expectEvent(receipt, "Grabbed", {
  //       user: userA,
  //       amount: AIRGRAB_AMOUNT,
  //     });
  //   });

  //   it("user can grab remaining amount", async () => {
  //     const receipt = await instance.grab({
  //       from: userB,
  //     });

  //     expect(await instance.balanceOf(userB)).to.be.bignumber.equal(
  //       ZERO_AMOUNT
  //     );

  //     expectEvent(receipt, "Grabbed", {
  //       user: userB,
  //       amount: AIRGRAB_REMAIN,
  //     });
  //   });

  //   it("airgrab is finished when token balance of the contract is zero", async () => {
  //     expect(await instance.FINISHED()).to.be.eq(true);
  //   });

  //   it("all tokens grabbed", async () => {
  //     expectRevert(
  //       instance.grab({
  //         from: userA,
  //       }),
  //       "Airgrab: all tokens has been grabbed"
  //     );
  //   });

  //   it("aigrab has expired", async () => {
  //     const start = await time.latest();
  //     const end = start.add(time.duration.days(30));
  //     await time.increaseTo(end);

  //     expectRevert(
  //       instance.grab({
  //         from: userA,
  //       }),
  //       "Airgrab: airgrab has ended"
  //     );
  //   });
  // });
});
