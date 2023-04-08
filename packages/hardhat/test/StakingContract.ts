import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";

import { InfusedToken, sETH } from "../typechain-types";

describe("InfusedToken", function () {
  async function setup() {
    const [user] = await ethers.getSigners();

    const sethFactory = await ethers.getContractFactory("sETH");
    let seth = (await sethFactory.deploy()) as sETH;
    await seth.deployed();
    seth = seth.connect(user);

    const infusedTokenFactory = await ethers.getContractFactory("InfusedToken");
    let infusedToken = (await infusedTokenFactory.deploy("sETHToken", "sETHT", seth.address)) as InfusedToken;
    await infusedToken.deployed();
    infusedToken = infusedToken.connect(user);

    const vaultFactory = await ethers.getContractFactory("Vault");
    let vault = await vaultFactory.deploy(infusedToken.address, seth.address, "sETH Vault", "vsETH");
    await vault.deployed();
    vault = vault.connect(user);

    return { seth, infusedToken, vault, user };
  }

  describe("Deploy", function () {
    it("should deploy", async function () {
      const { vault, infusedToken, seth } = await loadFixture(setup);

      expect(await vault.infusedToken()).to.equal(infusedToken.address);
      expect(await vault.asset()).to.equal(seth.address);
    });
  });

  describe("Scenario", function () {
    async function stakeSetup() {
      const s = await loadFixture(setup);
      const userBalance = ethers.utils.parseEther("10");
      await s.seth.mint(userBalance);
      await s.seth.approve(s.infusedToken.address, ethers.constants.MaxUint256);
      const firstTokenId = 1;
      await s.infusedToken.mint(userBalance);
      return { ...s, userBalance, tokenId: firstTokenId };
    }

    it("should run the scenario as expected", async function () {
      // Stake the infused token in the staking contract.
      const { vault, infusedToken, seth, tokenId, user, userBalance } = await loadFixture(stakeSetup);

      const userStartBalance = await seth.balanceOf(user.address);
      const tokenContractStartBalance = await seth.balanceOf(infusedToken.address);
      const vaultStartBalance = await seth.balanceOf(vault.address);

      expect(await vault.sharesPerToken(tokenId)).to.equal(0);

      await expect(infusedToken.stake(tokenId, vault.address))
        .to.emit(vault, "Deposit")
        .withArgs(infusedToken.address, user.address, userBalance, anyValue);

      await expect(infusedToken.stake(tokenId, vault.address)).to.be.reverted;

      expect(await seth.balanceOf(infusedToken.address)).to.equal(tokenContractStartBalance.sub(userBalance));
      expect(await seth.balanceOf(vault.address)).to.equal(vaultStartBalance.add(userBalance));
      const shares = await vault.sharesPerToken(tokenId);
      expect(shares).to.not.equal(0);

      // Fake yield harvest.
      await vault.harvest();

      expect(await infusedToken.burn(tokenId))
        .to.emit(infusedToken, "Transfer")
        .withArgs(user.address, ethers.constants.AddressZero, tokenId)
        .to.emit(vault, "Withdraw")
        .withArgs(infusedToken.address, user.address, infusedToken.address, anyValue, shares);
      expect(await vault.sharesPerToken(tokenId)).to.equal(0);
      expect(await seth.balanceOf(user.address)).to.be.greaterThan(userStartBalance);
    });
  });
});
