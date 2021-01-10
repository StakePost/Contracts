// SPDX-License-Identifier: MIT
pragma solidity ^0.6.8;

import "@openzeppelin/contracts/GSN/Context.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract StakePost is Context, Ownable, ReentrancyGuard {
    using SafeMath for uint256;
    using Address for address payable;

    uint256 public fee; //% in basis points
    address payable public feeCollector;

    struct Stakepost {
        address user;
        uint256 stake;
        bytes32 post;
        uint256 time;
    }

    Stakepost[] public posts;

    event StakeAndPost(address indexed user, uint256 stake, bytes32 post);
    event Exited(address indexed user);

    event FeeUpdated(uint256 fee);
    event FeeCollectorUpdated(address indexed collector);

    constructor() public {
        _setFee(0);
        _setFeeCollector(_msgSender());
    }

    function updateFee(uint256 _fee) public onlyOwner {
        _setFee(_fee);
        emit FeeUpdated(_fee);
    }

    function updateFeeCollector(address payable _collector) public onlyOwner {
        _setFeeCollector(_collector);
        emit FeeCollectorUpdated(_collector);
    }

    function getStakepostIndexByUser(address user)
        public
        view
        returns (int256)
    {
        for (uint256 i = 0; i < posts.length; i++) {
            if (posts[i].user == user) {
                return int256(i);
            }
        }
        return -1;
    }

    function stakeAndPost(bytes32 _postHash) public payable {
        uint256 stake = msg.value;

        int256 index = getStakepostIndexByUser(_msgSender());

        require(index == -1, "StakePost: user already staked");
        require(stake > 0, "StakePost: stake is zero");
        require(_postHash[0] != 0, "StakePost: postHash is empty");

        posts.push(Stakepost(_msgSender(), stake, _postHash, block.timestamp));

        emit StakeAndPost(_msgSender(), stake, _postHash);
    }

    function exit() public nonReentrant {
        address payable user = _msgSender();

        int256 index = getStakepostIndexByUser(_msgSender());

        require(index > -1, "StakePost: post does not exists");

        Stakepost storage post = posts[uint256(index)];

        require(
            post.time + 2 hours <= block.timestamp,
            "StakePost: exit not allowed by time"
        );

        uint256 returnValue = post.stake;

        if (fee > 0) {
            uint256 feeAmount = returnValue.mul(fee).div(1e4);
            returnValue = returnValue.sub(feeAmount);
            feeCollector.sendValue(feeAmount);
        }

        user.sendValue(returnValue);

        _deletePostAtIndex(uint256(index));

        emit Exited(user);
    }

    function _setFee(uint256 _fee) private {
        require(_fee >= 0, "StakePost: negative fee");
        require(_fee <= 1e4, "StakePost: exceed max fee");
        fee = _fee;
    }

    function _setFeeCollector(address payable _collector) private {
        require(_collector != address(0), "StakePost: zero collector address");
        feeCollector = _collector;
    }

    function _deletePostAtIndex(uint256 index) private {
        posts[index] = posts[posts.length - 1];
        posts.pop();
    }
}
