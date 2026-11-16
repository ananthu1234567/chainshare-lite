// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract FileShare {
    struct FileRecord {
        bytes32 fileHash;
        address sender;
        address receiver;
        uint256 timestamp;
        bool revoked;
    }

    mapping(bytes32 => FileRecord) private _files;
    mapping(address => bytes32[]) private _received;
    mapping(address => bytes32[]) private _sent;

    event FileShared(bytes32 indexed fileHash, address indexed sender, address indexed receiver, uint256 timestamp);
    event FileRevoked(bytes32 indexed fileHash, address indexed sender, address indexed receiver);

    error AlreadyShared();
    error InvalidReceiver();
    error NotSender();
    error NotFound();

    function shareFile(bytes32 fileHash, address receiver) external {
        if (receiver == address(0) || receiver == msg.sender) revert InvalidReceiver();
        if (_files[fileHash].sender != address(0)) revert AlreadyShared();

        _files[fileHash] = FileRecord(fileHash, msg.sender, receiver, block.timestamp, false);
        _received[receiver].push(fileHash);
        _sent[msg.sender].push(fileHash);

        emit FileShared(fileHash, msg.sender, receiver, block.timestamp);
    }

    function revokeFile(bytes32 fileHash) external {
        FileRecord storage f = _files[fileHash];
        if (f.sender == address(0)) revert NotFound();
        if (f.sender != msg.sender) revert NotSender();

        f.revoked = true;
        emit FileRevoked(fileHash, msg.sender, f.receiver);
    }

    function hasAccess(bytes32 fileHash, address user) external view returns (bool) {
        FileRecord storage f = _files[fileHash];
        if (f.sender == address(0)) return false;
        if (user == f.sender) return true;
        return user == f.receiver && !f.revoked;
    }

    function getFile(bytes32 fileHash) external view returns (FileRecord memory) {
        if (_files[fileHash].sender == address(0)) revert NotFound();
        return _files[fileHash];
    }

    function getReceived(address user) external view returns (bytes32[] memory) {
        return _received[user];
    }

    function getSent(address user) external view returns (bytes32[] memory) {
        return _sent[user];
    }
}