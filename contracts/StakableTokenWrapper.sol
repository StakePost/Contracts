// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import "@openzeppelin/contracts-upgradeable/GSN/ContextUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/Initializable.sol";

contract StakableTokenWrapper is Initializable, ContextUpgradeable {
    using SafeMathUpgradeable for uint256;
    IERC20Upgradeable public token;

    function __StakableTokenWrapper_init(IERC20Upgradeable _tokenAddress)
        internal
        initializer
    {
        __Context_init_unchained();
        __StakableTokenWrapper_init_unchained(_tokenAddress);
    }

    function __StakableTokenWrapper_init_unchained(
        IERC20Upgradeable _tokenAddress
    ) internal initializer {
        token = IERC20Upgradeable(_tokenAddress);
    }

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;

    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public virtual {
        _totalSupply = _totalSupply.add(amount);
        _balances[_msgSender()] = _balances[_msgSender()].add(amount);
        token.transferFrom(_msgSender(), address(this), amount);
    }

    function withdraw(uint256 amount) public virtual {
        _totalSupply = _totalSupply.sub(amount);
        _balances[_msgSender()] = _balances[_msgSender()].sub(amount);
        token.transfer(_msgSender(), amount);
    }
}
