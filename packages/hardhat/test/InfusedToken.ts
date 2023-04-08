import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

import { InfusedToken, sETH } from "../typechain-types";

describe("InfusedToken", function () {
  // We define a fixture to reuse the same setup in every test.

  async function setup() {
    const [deployer, user] = await ethers.getSigners();

    const sethFactory = await ethers.getContractFactory("sETH");
    let seth = (await sethFactory.deploy()) as sETH;
    await seth.deployed();
    seth = seth.connect(user);

    const infusedTokenFactory = await ethers.getContractFactory("InfusedToken");
    let infusedToken = (await infusedTokenFactory.deploy("sETHToken", "sETHT", seth.address)) as InfusedToken;
    await infusedToken.deployed();
    infusedToken = infusedToken.connect(user);

    return { seth, infusedToken, deployer, user };
  }

  describe("Deployment", function () {
    it("should deploy", async function () {
      const { infusedToken, seth } = await loadFixture(setup);
      expect(await infusedToken.asset()).to.equal(seth.address);
    });

    it("should not own any asset", async function () {
      const { infusedToken, seth } = await loadFixture(setup);
      expect(await seth.balanceOf(infusedToken.address)).to.equal(0);
    });
  });

  describe("Mint", function () {
    async function mintSetup() {
      const s = await loadFixture(setup);
      const userBalance = ethers.utils.parseEther("10");
      await s.seth.mint(userBalance);
      expect(await s.seth.balanceOf(s.user.address)).to.equal(userBalance);
      return { ...s, userBalance };
    }

    it("should mint a token and infuse it with fungible tokens", async function () {
      const { seth, infusedToken, user, userBalance } = await loadFixture(mintSetup);
      await seth.approve(infusedToken.address, ethers.constants.MaxUint256);
      const firstTokenId = 1;
      await expect(infusedToken.mint(userBalance))
        .to.emit(infusedToken, "Transfer")
        .withArgs(ethers.constants.AddressZero, user.address, firstTokenId);

      expect(await infusedToken.infusedAmount(firstTokenId)).to.equal(userBalance);
      expect(await infusedToken.stakedAt(firstTokenId)).to.equal(ethers.constants.AddressZero);

      expect(await infusedToken.tokenURI(firstTokenId)).to.equal(
        "data:application/json;base64,eyJuYW1lIjoiSW5mdXNlZCB0b2tlbiIsImRlc2NyaXB0aW9uIjoic0VUSCAxMCIsImltYWdlIjoiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCNGJXeHVjejBuYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNuSUhacFpYZENiM2c5SnpBZ01DQXpNREFnTkRnd0p6NDhjM1I1YkdVK0xtRnpjMlYwSUhzZ1ptOXVkRG9nWW05c1pDQXpNSEI0SUhOaGJuTXRjMlZ5YVdZN0lIMHVZVzF2ZFc1MElIc2dabTl1ZERvZ2JtOXliV0ZzSURJMmNIZ2djMkZ1Y3kxelpYSnBaanNnZlR3dmMzUjViR1UrUEhKbFkzUWdkMmxrZEdnOUlqTXdNQ0lnYUdWcFoyaDBQU0kwT0RBaUlHWnBiR3c5SW1oemJDZzNNeXcwTUNVc05EQWxLU0l2UGp4eVpXTjBJSGc5SWpNd0lpQjVQU0l6TUNJZ2QybGtkR2c5SWpJME1DSWdhR1ZwWjJoMFBTSTBNakFpSUhKNFBTSXhOU0lnY25rOUlqRTFJaUJtYVd4c1BTSm9jMndvTnpNc01UQXdKU3cxTUNVcElpQnpkSEp2YTJVOUlpTXdNREFpTHo0OGNtVmpkQ0I0UFNJek1DSWdlVDBpT0RjaUlIZHBaSFJvUFNJeU5EQWlJR2hsYVdkb2REMGlORElpTHo0OGRHVjRkQ0I0UFNJek9TSWdlVDBpTVRJd0lpQmpiR0Z6Y3owaVlYTnpaWFFpSUdacGJHdzlJaU5tWm1ZaVBuTkZWRWc4TDNSbGVIUStQSEpsWTNRZ2VEMGlNekFpSUhrOUlqRXpNaUlnZDJsa2RHZzlJakkwTUNJZ2FHVnBaMmgwUFNJek1DSXZQangwWlhoMElIZzlJak01SWlCNVBTSXhNakFpSUdSNVBTSXpOaUlnWTJ4aGMzTTlJbUZ0YjNWdWRDSWdabWxzYkQwaUkyWm1aaUkrTVRBOEwzUmxlSFErUEM5emRtYysifQ==",
      );
    });
  });

  describe("Burn", function () {
    async function burnSetup() {
      const s = await loadFixture(setup);
      const userBalance = ethers.utils.parseEther("10");
      await s.seth.mint(userBalance);
      await s.seth.approve(s.infusedToken.address, ethers.constants.MaxUint256);
      const firstTokenId = 1;
      await s.infusedToken.mint(userBalance);
      return { ...s, userBalance, tokenId: firstTokenId };
    }

    it("should burn a non staked token and get back at least the infused amount", async function () {
      const { seth, infusedToken, user, userBalance, tokenId } = await loadFixture(burnSetup);
      const previousBalance = await seth.balanceOf(user.address);
      await expect(infusedToken.burn(tokenId))
        .to.emit(infusedToken, "Transfer")
        .withArgs(user.address, ethers.constants.AddressZero, tokenId);

      expect(await infusedToken.infusedAmount(tokenId)).to.equal(ethers.constants.Zero);
      expect(await infusedToken.stakedAt(tokenId)).to.equal(ethers.constants.AddressZero);
      expect((await seth.balanceOf(user.address)).sub(previousBalance)).to.equal(userBalance);
    });
  });
});
