export type Bridge = {
  "version": "0.1.0",
  "name": "bridge",
  "constants": [
    {
      "name": "GLOBAL_CONFIG",
      "type": "string",
      "value": "\"GLOBAL_CONFIG\""
    },
    {
      "name": "TOKEN_CONFIG",
      "type": "string",
      "value": "\"TOKEN_CONFIG\""
    },
    {
      "name": "COMMITTEE_CONFIG",
      "type": "string",
      "value": "\"COMMITTEE_CONFIG\""
    },
    {
      "name": "COMMITTEE_SUBMITTER_CONFIG",
      "type": "string",
      "value": "\"COMMITTEE_SUBMITTER_CONFIG\""
    },
    {
      "name": "SUPPORTED_CHAINS_CONFIG",
      "type": "string",
      "value": "\"SUPPORTED_CHAINS_CONFIG\""
    },
    {
      "name": "DECIMALS9",
      "type": "u8",
      "value": "9"
    },
    {
      "name": "ANCHOR_HEADER_LEN",
      "type": {
        "defined": "usize"
      },
      "value": "8"
    },
    {
      "name": "HARDCODED_PUBKEY",
      "type": "publicKey",
      "value": "pubkey ! (\"admvjpCSCJxquTVPsNtCCoTno4zC1ozAnSu6wt2BmnV\")"
    }
  ],
  "instructions": [
    {
      "name": "createBridgeConfig",
      "accounts": [
        {
          "name": "bridgeConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The account paying for all rents"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "chainId",
          "type": "u8"
        },
        {
          "name": "feeRecipient",
          "type": "publicKey"
        },
        {
          "name": "supportedTokens",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "tokenPrices",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "supportedChains",
          "type": "bytes"
        },
        {
          "name": "tokenFeePercentages",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "tokenMinAmount",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "createBridgeCommittee",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "submitterPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "submitter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "committee",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "stake",
          "type": {
            "vec": "u16"
          }
        },
        {
          "name": "minStakeRequired",
          "type": "u16"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "committee",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "stakeAmount",
            "type": "u16"
          },
          {
            "name": "isBlocklisted",
            "type": "bool"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "submitter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "isSubmitter",
            "type": "bool"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "bridgeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "feeRecipient",
            "type": "publicKey"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "tokenAddress",
            "type": "publicKey"
          },
          {
            "name": "decimal",
            "type": "u8"
          },
          {
            "name": "native",
            "type": "bool"
          },
          {
            "name": "tokenPrice",
            "type": "u64"
          },
          {
            "name": "tokenFeePercentage",
            "type": "u64"
          },
          {
            "name": "tokenMinAmount",
            "type": "u64"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "supportedChainConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "supported",
            "type": "bool"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "AirdropMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "meme",
            "type": "publicKey"
          },
          {
            "name": "count",
            "type": "u64"
          },
          {
            "name": "expiry",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "WhitelistPair",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "percent",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "WhitelistMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "meme",
            "type": "publicKey"
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "items",
            "type": {
              "vec": {
                "defined": "WhitelistPair"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSupportedTokenAddresses",
      "msg": "Invalid supported token addresses"
    },
    {
      "code": 6001,
      "name": "InvalidTokenFeePercentage",
      "msg": "Invalid token fee percentage"
    },
    {
      "code": 6002,
      "name": "InvalidIdsLength",
      "msg": "Invalid Ids Length"
    },
    {
      "code": 6003,
      "name": "InvalidTokenMinimumAmount",
      "msg": "Invalid token minimum amount"
    },
    {
      "code": 6004,
      "name": "InvalidTokenPrices",
      "msg": "Invalid token prices"
    },
    {
      "code": 6005,
      "name": "InvalidAdminAddress",
      "msg": "Invalid admin address"
    },
    {
      "code": 6006,
      "name": "InvalidFeeRecipientAddress",
      "msg": "Invalid fee recipient address"
    },
    {
      "code": 6007,
      "name": "CannotSupportSelf",
      "msg": "Cannot support self"
    },
    {
      "code": 6008,
      "name": "TokenConfigAddressMissing",
      "msg": "Token Config Address Missing"
    },
    {
      "code": 6009,
      "name": "SupportedChainAddressMissing",
      "msg": "Token Config Address Missing"
    },
    {
      "code": 6010,
      "name": "DeserializeAirdropMessageError",
      "msg": "Deserialize Airdrop Message Error"
    },
    {
      "code": 6011,
      "name": "DeserializeWhitelistMessageError",
      "msg": "Deserialize Whitelist Message Error"
    },
    {
      "code": 6012,
      "name": "DeserializationError",
      "msg": "Deserialization Error"
    },
    {
      "code": 6013,
      "name": "BridgeConfigSerializationError",
      "msg": "Bridge Config Serialization Error"
    },
    {
      "code": 6014,
      "name": "SupportedChainSerializationError",
      "msg": "Supported Chain Serialization Error"
    },
    {
      "code": 6015,
      "name": "CommitteeLengthExceedsLimit",
      "msg": "Committee Length Exceeds Limit"
    },
    {
      "code": 6016,
      "name": "CommitteeAndStakeLengthMismatch",
      "msg": "Committee And Stake Length Mismatch"
    },
    {
      "code": 6017,
      "name": "InsufficientTotalStake",
      "msg": "Insufficient Total Stake"
    },
    {
      "code": 6018,
      "name": "CommitteeConfigAddressMissing",
      "msg": "Committee Config Address Missing"
    },
    {
      "code": 6019,
      "name": "BridgeCommitteeSerializationError",
      "msg": "Bridge Committee Serialization Error"
    },
    {
      "code": 6020,
      "name": "SubmitterConfigAddressMissing",
      "msg": "Submitter Config Address Missing"
    }
  ]
};

export const IDL: Bridge = {
  "version": "0.1.0",
  "name": "bridge",
  "constants": [
    {
      "name": "GLOBAL_CONFIG",
      "type": "string",
      "value": "\"GLOBAL_CONFIG\""
    },
    {
      "name": "TOKEN_CONFIG",
      "type": "string",
      "value": "\"TOKEN_CONFIG\""
    },
    {
      "name": "COMMITTEE_CONFIG",
      "type": "string",
      "value": "\"COMMITTEE_CONFIG\""
    },
    {
      "name": "COMMITTEE_SUBMITTER_CONFIG",
      "type": "string",
      "value": "\"COMMITTEE_SUBMITTER_CONFIG\""
    },
    {
      "name": "SUPPORTED_CHAINS_CONFIG",
      "type": "string",
      "value": "\"SUPPORTED_CHAINS_CONFIG\""
    },
    {
      "name": "DECIMALS9",
      "type": "u8",
      "value": "9"
    },
    {
      "name": "ANCHOR_HEADER_LEN",
      "type": {
        "defined": "usize"
      },
      "value": "8"
    },
    {
      "name": "HARDCODED_PUBKEY",
      "type": "publicKey",
      "value": "pubkey ! (\"admvjpCSCJxquTVPsNtCCoTno4zC1ozAnSu6wt2BmnV\")"
    }
  ],
  "instructions": [
    {
      "name": "createBridgeConfig",
      "accounts": [
        {
          "name": "bridgeConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The account paying for all rents"
          ]
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "chainId",
          "type": "u8"
        },
        {
          "name": "feeRecipient",
          "type": "publicKey"
        },
        {
          "name": "supportedTokens",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "tokenPrices",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "supportedChains",
          "type": "bytes"
        },
        {
          "name": "tokenFeePercentages",
          "type": {
            "vec": "u64"
          }
        },
        {
          "name": "tokenMinAmount",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "createBridgeCommittee",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "submitterPda",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "submitter",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "committee",
          "type": {
            "vec": "publicKey"
          }
        },
        {
          "name": "stake",
          "type": {
            "vec": "u16"
          }
        },
        {
          "name": "minStakeRequired",
          "type": "u16"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "committee",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "index",
            "type": "u8"
          },
          {
            "name": "stakeAmount",
            "type": "u16"
          },
          {
            "name": "isBlocklisted",
            "type": "bool"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "submitter",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "isSubmitter",
            "type": "bool"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "bridgeConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "feeRecipient",
            "type": "publicKey"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "tokenConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "tokenAddress",
            "type": "publicKey"
          },
          {
            "name": "decimal",
            "type": "u8"
          },
          {
            "name": "native",
            "type": "bool"
          },
          {
            "name": "tokenPrice",
            "type": "u64"
          },
          {
            "name": "tokenFeePercentage",
            "type": "u64"
          },
          {
            "name": "tokenMinAmount",
            "type": "u64"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    },
    {
      "name": "supportedChainConfig",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "supported",
            "type": "bool"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                16
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "AirdropMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "meme",
            "type": "publicKey"
          },
          {
            "name": "count",
            "type": "u64"
          },
          {
            "name": "expiry",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "WhitelistPair",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "address",
            "type": "publicKey"
          },
          {
            "name": "percent",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "WhitelistMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "meme",
            "type": "publicKey"
          },
          {
            "name": "expiry",
            "type": "i64"
          },
          {
            "name": "items",
            "type": {
              "vec": {
                "defined": "WhitelistPair"
              }
            }
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InvalidSupportedTokenAddresses",
      "msg": "Invalid supported token addresses"
    },
    {
      "code": 6001,
      "name": "InvalidTokenFeePercentage",
      "msg": "Invalid token fee percentage"
    },
    {
      "code": 6002,
      "name": "InvalidIdsLength",
      "msg": "Invalid Ids Length"
    },
    {
      "code": 6003,
      "name": "InvalidTokenMinimumAmount",
      "msg": "Invalid token minimum amount"
    },
    {
      "code": 6004,
      "name": "InvalidTokenPrices",
      "msg": "Invalid token prices"
    },
    {
      "code": 6005,
      "name": "InvalidAdminAddress",
      "msg": "Invalid admin address"
    },
    {
      "code": 6006,
      "name": "InvalidFeeRecipientAddress",
      "msg": "Invalid fee recipient address"
    },
    {
      "code": 6007,
      "name": "CannotSupportSelf",
      "msg": "Cannot support self"
    },
    {
      "code": 6008,
      "name": "TokenConfigAddressMissing",
      "msg": "Token Config Address Missing"
    },
    {
      "code": 6009,
      "name": "SupportedChainAddressMissing",
      "msg": "Token Config Address Missing"
    },
    {
      "code": 6010,
      "name": "DeserializeAirdropMessageError",
      "msg": "Deserialize Airdrop Message Error"
    },
    {
      "code": 6011,
      "name": "DeserializeWhitelistMessageError",
      "msg": "Deserialize Whitelist Message Error"
    },
    {
      "code": 6012,
      "name": "DeserializationError",
      "msg": "Deserialization Error"
    },
    {
      "code": 6013,
      "name": "BridgeConfigSerializationError",
      "msg": "Bridge Config Serialization Error"
    },
    {
      "code": 6014,
      "name": "SupportedChainSerializationError",
      "msg": "Supported Chain Serialization Error"
    },
    {
      "code": 6015,
      "name": "CommitteeLengthExceedsLimit",
      "msg": "Committee Length Exceeds Limit"
    },
    {
      "code": 6016,
      "name": "CommitteeAndStakeLengthMismatch",
      "msg": "Committee And Stake Length Mismatch"
    },
    {
      "code": 6017,
      "name": "InsufficientTotalStake",
      "msg": "Insufficient Total Stake"
    },
    {
      "code": 6018,
      "name": "CommitteeConfigAddressMissing",
      "msg": "Committee Config Address Missing"
    },
    {
      "code": 6019,
      "name": "BridgeCommitteeSerializationError",
      "msg": "Bridge Committee Serialization Error"
    },
    {
      "code": 6020,
      "name": "SubmitterConfigAddressMissing",
      "msg": "Submitter Config Address Missing"
    }
  ]
};
