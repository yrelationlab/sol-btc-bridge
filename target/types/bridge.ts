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
      "name": "SBTC_MINT",
      "type": "string",
      "value": "\"SBTC_MINT\""
    },
    {
      "name": "NONCE_CONFIG",
      "type": "string",
      "value": "\"NONCE_CONFIG\""
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
      "name": "LIMITER_CONFIG",
      "type": "string",
      "value": "\"LIMITER_CONFIG\""
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
      "name": "MAX_STRING_LENGTH",
      "type": {
        "defined": "usize"
      },
      "value": "255"
    },
    {
      "name": "FEE_DENOMINATOR",
      "type": "u64",
      "value": "1000000"
    }
  ],
  "instructions": [
    {
      "name": "createBridgeConfig",
      "docs": [
        "# Arguments",
        "",
        "* `ctx` - The context containing all accounts required for this instruction.",
        "* `chain_id` - The ID of the chain for which the bridge configuration is being created.",
        "* `fee_recipient` - The public key of the account that will receive fees.",
        "* `token_ids` - A vector of token IDs that will be supported by the bridge.",
        "* `supported_chains` - A vector of chain IDs that will be supported by the bridge.",
        "* `token_fee_percentages` - A vector of fee percentages for each token.",
        "* `token_min_amount` - A vector of minimum amounts for each token.",
        "* note: each supported_chain has at least one <token_id, token_price>",
        "",
        "# Returns",
        "",
        "This function returns a `Result` which is `Ok` if the bridge configuration is created successfully,",
        "or an `Error` if there is an issue with the provided arguments or during the creation process."
      ],
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
          "name": "sbtcMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "chainId",
          "type": "u8"
        },
        {
          "name": "administrator",
          "type": "publicKey"
        },
        {
          "name": "feeRecipient",
          "type": "publicKey"
        },
        {
          "name": "tokenIds",
          "type": "bytes"
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
      "name": "addOrUpdateChain",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The account paying for all rents"
          ]
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "supportedChainConfig",
          "isMut": true,
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
          "name": "chainId",
          "type": "u8"
        },
        {
          "name": "supportedChainId",
          "type": "u8"
        },
        {
          "name": "supported",
          "type": "bool"
        }
      ]
    },
    {
      "name": "addOrUpdateChainToken",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The account paying for all rents"
          ]
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "supportedChainConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenConfig",
          "isMut": true,
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
          "name": "chainId",
          "type": "u8"
        },
        {
          "name": "supportedChainId",
          "type": "u8"
        },
        {
          "name": "tokenId",
          "type": "u8"
        },
        {
          "name": "tokenFeePercentages",
          "type": "u64"
        },
        {
          "name": "tokenMinAmount",
          "type": "u64"
        },
        {
          "name": "withdrawPaused",
          "type": "bool"
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
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
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
          "name": "chianId",
          "type": "u8"
        },
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
        }
      ]
    },
    {
      "name": "addOrUpdateCommittee",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "committeeConfig",
          "isMut": true,
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
          "name": "chianId",
          "type": "u8"
        },
        {
          "name": "committee",
          "type": "publicKey"
        },
        {
          "name": "stake",
          "type": "u16"
        },
        {
          "name": "isBlocklisted",
          "type": "bool"
        }
      ]
    },
    {
      "name": "addOrUpdateSubmitter",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
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
          "name": "chianId",
          "type": "u8"
        },
        {
          "name": "isSubmitter",
          "type": "bool"
        }
      ]
    },
    {
      "name": "mintSbtcWithSignatures",
      "accounts": [
        {
          "name": "submitter",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The submitter calls it"
          ]
        },
        {
          "name": "submitterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bridgeConfig",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "1. load BridgeConfig"
          ]
        },
        {
          "name": "supportedChainConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "the user to receive minted sBTC"
          ]
        },
        {
          "name": "limiter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionsSysvar",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "numberOfSignatures",
          "type": "u8"
        },
        {
          "name": "msg",
          "type": {
            "defined": "MintSbtcMessage"
          }
        }
      ]
    },
    {
      "name": "withdrawBtc",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "1. load BridgeConfig"
          ]
        },
        {
          "name": "supportedChainConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "msg",
          "type": {
            "defined": "WithdrawBtcMessage"
          }
        }
      ]
    },
    {
      "name": "addOrUpdateLimiterWithSignatures",
      "accounts": [
        {
          "name": "submitter",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The submitter calls it"
          ]
        },
        {
          "name": "submitterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "supportedChainConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "limiter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionsSysvar",
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
          "name": "numberOfSignatures",
          "type": "u8"
        },
        {
          "name": "msg",
          "type": {
            "defined": "UpdateLimiterMsg"
          }
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
            "type": "publicKey"
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
                10
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
            "name": "submitter",
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
                10
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
            "name": "withdrawPaused",
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
            "name": "sbtcMint",
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
                10
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
            "name": "withdrawPaused",
            "type": "bool"
          },
          {
            "name": "tokenId",
            "type": "u8"
          },
          {
            "name": "chainId",
            "type": "u8"
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
            "name": "tokenFeePercentage",
            "type": "u64"
          },
          {
            "name": "tokenMinAmount",
            "type": "u64"
          },
          {
            "name": "mintTotal",
            "type": "u128"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                10
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
            "name": "mintTotal",
            "type": "u128"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          }
        ]
      }
    },
    {
      "name": "nonces",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "nonce",
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
                10
              ]
            }
          }
        ]
      }
    },
    {
      "name": "chainTokenLimiter",
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
            "name": "tokenId",
            "type": "u8"
          },
          {
            "name": "totalLimit",
            "type": "u64"
          },
          {
            "name": "oldestHour",
            "type": "u32"
          },
          {
            "name": "hourlyTransfers",
            "type": {
              "array": [
                "u64",
                24
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MintSbtcMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "messageType",
            "type": "u8"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "sourceChainId",
            "type": "u8"
          },
          {
            "name": "sourceTokenId",
            "type": "u8"
          },
          {
            "name": "fromAddress",
            "type": "bytes"
          },
          {
            "name": "toChainId",
            "type": "u8"
          },
          {
            "name": "toAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UpdateLimiterMsg",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "messageType",
            "type": "u8"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "targetChainId",
            "type": "u8"
          },
          {
            "name": "tokenId",
            "type": "u8"
          },
          {
            "name": "totalLimit",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "WithdrawBtcMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "messageType",
            "type": "u8"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "toChainId",
            "type": "u8"
          },
          {
            "name": "toTokenId",
            "type": "u8"
          },
          {
            "name": "toAddress",
            "type": "bytes"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "fromAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UpdateSupportedChainMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "supported",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "TokenTransferPayload",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "senderAddressLength",
            "type": "u8"
          },
          {
            "name": "senderAddress",
            "type": "bytes"
          },
          {
            "name": "targetChain",
            "type": "u8"
          },
          {
            "name": "recipientAddressLength",
            "type": "u8"
          },
          {
            "name": "recipientAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "tokenId",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Operation",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TokenTransfer"
          },
          {
            "name": "Blocklist"
          },
          {
            "name": "EmergencyOp"
          },
          {
            "name": "UpdateBridgeLimit"
          },
          {
            "name": "UpdateTokenPrice"
          },
          {
            "name": "Upgrade"
          },
          {
            "name": "AddEvmTokens"
          },
          {
            "name": "UpdateChainId"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "LimitUpdated",
      "fields": [
        {
          "name": "chainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "tokenId",
          "type": "u8",
          "index": false
        },
        {
          "name": "totalLimit",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "LimitEvent",
      "fields": [
        {
          "name": "currentH",
          "type": "u32",
          "index": false
        },
        {
          "name": "currentSlot",
          "type": "u8",
          "index": false
        },
        {
          "name": "totalBefore",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalAfter",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "MintSbtcEvent",
      "fields": [
        {
          "name": "messageType",
          "type": "u8",
          "index": false
        },
        {
          "name": "version",
          "type": "u8",
          "index": false
        },
        {
          "name": "nonce",
          "type": "u64",
          "index": false
        },
        {
          "name": "sourceChainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "sourceTokenId",
          "type": "u8",
          "index": false
        },
        {
          "name": "fromAddress",
          "type": "bytes",
          "index": false
        },
        {
          "name": "toChainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "toAddress",
          "type": {
            "array": [
              "u8",
              32
            ]
          },
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "chainMintTotal",
          "type": "u128",
          "index": false
        },
        {
          "name": "tokenMintTotal",
          "type": "u128",
          "index": false
        }
      ]
    },
    {
      "name": "WithdrawBtctcEvent",
      "fields": [
        {
          "name": "messageType",
          "type": "u8",
          "index": false
        },
        {
          "name": "version",
          "type": "u8",
          "index": false
        },
        {
          "name": "nonce",
          "type": "u64",
          "index": false
        },
        {
          "name": "toChainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "toTokenId",
          "type": "u8",
          "index": false
        },
        {
          "name": "toAddress",
          "type": "bytes",
          "index": false
        },
        {
          "name": "chainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "fromAddress",
          "type": {
            "array": [
              "u8",
              32
            ]
          },
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "chainMintTotal",
          "type": "u128",
          "index": false
        },
        {
          "name": "tokenMintTotal",
          "type": "u128",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InsufficientStake",
      "msg": "Insufficient Stake"
    },
    {
      "code": 6001,
      "name": "InvalidMessageType",
      "msg": "Invalid Message Type"
    },
    {
      "code": 6002,
      "name": "InvalidOpCode",
      "msg": "Invalid Op Code"
    },
    {
      "code": 6003,
      "name": "InvalidSupportedTokenAddresses",
      "msg": "Invalid Supported Token Addresses"
    },
    {
      "code": 6004,
      "name": "InvalidChain",
      "msg": "Invalid Chain"
    },
    {
      "code": 6005,
      "name": "InvalidTokenFeePercentage",
      "msg": "Invalid Token Fee Percentage"
    },
    {
      "code": 6006,
      "name": "InvalidIdsLength",
      "msg": "Invalid Ids Length"
    },
    {
      "code": 6007,
      "name": "InvalidTokenMinimumAmount",
      "msg": "Invalid Token Minimum Amount"
    },
    {
      "code": 6008,
      "name": "InvalidTokenIds",
      "msg": "Invalid Token Ids"
    },
    {
      "code": 6009,
      "name": "InvalidAdminAddress",
      "msg": "Invalid Admin Address"
    },
    {
      "code": 6010,
      "name": "InvalidFeeRecipientAddress",
      "msg": "Invalid Fee Recipient Address"
    },
    {
      "code": 6011,
      "name": "CannotSupportSelf",
      "msg": "Cannot Support Self"
    },
    {
      "code": 6012,
      "name": "TokenConfigAddressMissing",
      "msg": "Token Config Address Missing"
    },
    {
      "code": 6013,
      "name": "SupportedChainAddressMissing",
      "msg": "Token Config Address Missing"
    },
    {
      "code": 6014,
      "name": "DeserializeAirdropMessageError",
      "msg": "Deserialize Airdrop Message Error"
    },
    {
      "code": 6015,
      "name": "DeserializeWhitelistMessageError",
      "msg": "Deserialize Whitelist Message Error"
    },
    {
      "code": 6016,
      "name": "DeserializationError",
      "msg": "Deserialization Error"
    },
    {
      "code": 6017,
      "name": "BridgeConfigSerializationError",
      "msg": "Bridge Config Serialization Error"
    },
    {
      "code": 6018,
      "name": "SupportedChainSerializationError",
      "msg": "Supported Chain Serialization Error"
    },
    {
      "code": 6019,
      "name": "CommitteeLengthExceedsLimit",
      "msg": "Committee Length Exceeds Limit"
    },
    {
      "code": 6020,
      "name": "CommitteeAndStakeLengthMismatch",
      "msg": "Committee And Stake Length Mismatch"
    },
    {
      "code": 6021,
      "name": "InsufficientTotalStake",
      "msg": "Insufficient Total Stake"
    },
    {
      "code": 6022,
      "name": "CommitteeConfigAddressMissing",
      "msg": "Committee Config Address Missing"
    },
    {
      "code": 6023,
      "name": "BridgeCommitteeSerializationError",
      "msg": "Bridge Committee Serialization Error"
    },
    {
      "code": 6024,
      "name": "SubmitterConfigAddressMissing",
      "msg": "Submitter Config Address Missing"
    },
    {
      "code": 6025,
      "name": "Expired",
      "msg": "Expired"
    },
    {
      "code": 6026,
      "name": "InvalidPayloadLength",
      "msg": "InvalidPay load Length"
    },
    {
      "code": 6027,
      "name": "FailedToParseTokenPrice",
      "msg": "Failed To  Parse Token Price"
    },
    {
      "code": 6028,
      "name": "InsufficientSignatures",
      "msg": "Insufficient Signatures"
    },
    {
      "code": 6029,
      "name": "DeserializeMessageError",
      "msg": "Deserialize Message Error"
    },
    {
      "code": 6030,
      "name": "MessageMismatch",
      "msg": "Message Mismatch"
    },
    {
      "code": 6031,
      "name": "SupportedChainNotInitialized",
      "msg": "Supported Chain Not Initialized"
    },
    {
      "code": 6032,
      "name": "MessageOpTypeMismatch",
      "msg": "Message Op Type Mismatch"
    },
    {
      "code": 6033,
      "name": "BridgeConfigNotInitialized",
      "msg": "Bridge Config Not Initialized"
    },
    {
      "code": 6034,
      "name": "SupportedChainConfigNotInitialized",
      "msg": "Supported Chain Config Not Initialized"
    },
    {
      "code": 6035,
      "name": "TokenConfigNotInitialized",
      "msg": "Token Config Not Initialized"
    },
    {
      "code": 6036,
      "name": "SupportedChainConfigNoSupported",
      "msg": "Supported Chain Config Not Supported"
    },
    {
      "code": 6037,
      "name": "ChainIdMismatch",
      "msg": "Chain Id Mismatch"
    },
    {
      "code": 6038,
      "name": "DuplicateSignature",
      "msg": "Duplicate Signature"
    },
    {
      "code": 6039,
      "name": "SubmitterNotInitialized",
      "msg": "Submitter Not Initialized"
    },
    {
      "code": 6040,
      "name": "NotSubmitter",
      "msg": "Not A Submitter"
    },
    {
      "code": 6041,
      "name": "SigVerificationFailed",
      "msg": "Signature verification failed"
    },
    {
      "code": 6042,
      "name": "InstructionMissing",
      "msg": "InstructionMissing"
    },
    {
      "code": 6043,
      "name": "InvalidSigner",
      "msg": "Invalid Signer"
    },
    {
      "code": 6044,
      "name": "InvalidNonce",
      "msg": "Invalid Nonce"
    },
    {
      "code": 6045,
      "name": "WithdrawPaused",
      "msg": "Withdraw Paused"
    },
    {
      "code": 6046,
      "name": "BridgeWithdrawPaused",
      "msg": "Bridge Withdraw Paused"
    },
    {
      "code": 6047,
      "name": "InvalidAddress",
      "msg": "Invalid Address"
    },
    {
      "code": 6048,
      "name": "InvalidMinAmount",
      "msg": "Invalid Min Amount"
    },
    {
      "code": 6049,
      "name": "InvalidUserAddress",
      "msg": "Invalid User Address"
    },
    {
      "code": 6050,
      "name": "InvalidFeeRecipient",
      "msg": "Invalid Fee Recipient"
    },
    {
      "code": 6051,
      "name": "LackTargetMint",
      "msg": "Lack Target Mint"
    },
    {
      "code": 6052,
      "name": "ChainIdShouldDiffFromSolanaChainId",
      "msg": "ChainId Should Diff From Solana Chain Id"
    },
    {
      "code": 6053,
      "name": "AccountNotFound",
      "msg": "AccountNotFound"
    },
    {
      "code": 6054,
      "name": "FeeRecipientNotFound",
      "msg": "Fee Recipient Not Found"
    },
    {
      "code": 6055,
      "name": "FeeRecipientSbtcAtaNotFound",
      "msg": "Fee Recipient Sbtc Ata Not Found"
    },
    {
      "code": 6056,
      "name": "UserAccountNotFound",
      "msg": "User Account Not Found"
    },
    {
      "code": 6057,
      "name": "UserSbtcAtaNotFound",
      "msg": "User Sbtc Ata Not Found"
    },
    {
      "code": 6058,
      "name": "SbtcMintAccountNotFound",
      "msg": "Sbtc Mint Account Not Found"
    },
    {
      "code": 6059,
      "name": "TimeError",
      "msg": "Time Error"
    },
    {
      "code": 6060,
      "name": "TransferLimitExceeded",
      "msg": "Transfer Limit Exceeded"
    },
    {
      "code": 6061,
      "name": "BiggerThanFeeDenominator",
      "msg": "Bigger Than Fee Denominator"
    },
    {
      "code": 6062,
      "name": "UserNotFound",
      "msg": "User Not Found"
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
      "name": "SBTC_MINT",
      "type": "string",
      "value": "\"SBTC_MINT\""
    },
    {
      "name": "NONCE_CONFIG",
      "type": "string",
      "value": "\"NONCE_CONFIG\""
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
      "name": "LIMITER_CONFIG",
      "type": "string",
      "value": "\"LIMITER_CONFIG\""
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
      "name": "MAX_STRING_LENGTH",
      "type": {
        "defined": "usize"
      },
      "value": "255"
    },
    {
      "name": "FEE_DENOMINATOR",
      "type": "u64",
      "value": "1000000"
    }
  ],
  "instructions": [
    {
      "name": "createBridgeConfig",
      "docs": [
        "# Arguments",
        "",
        "* `ctx` - The context containing all accounts required for this instruction.",
        "* `chain_id` - The ID of the chain for which the bridge configuration is being created.",
        "* `fee_recipient` - The public key of the account that will receive fees.",
        "* `token_ids` - A vector of token IDs that will be supported by the bridge.",
        "* `supported_chains` - A vector of chain IDs that will be supported by the bridge.",
        "* `token_fee_percentages` - A vector of fee percentages for each token.",
        "* `token_min_amount` - A vector of minimum amounts for each token.",
        "* note: each supported_chain has at least one <token_id, token_price>",
        "",
        "# Returns",
        "",
        "This function returns a `Result` which is `Ok` if the bridge configuration is created successfully,",
        "or an `Error` if there is an issue with the provided arguments or during the creation process."
      ],
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
          "name": "sbtcMint",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "chainId",
          "type": "u8"
        },
        {
          "name": "administrator",
          "type": "publicKey"
        },
        {
          "name": "feeRecipient",
          "type": "publicKey"
        },
        {
          "name": "tokenIds",
          "type": "bytes"
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
      "name": "addOrUpdateChain",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The account paying for all rents"
          ]
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "supportedChainConfig",
          "isMut": true,
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
          "name": "chainId",
          "type": "u8"
        },
        {
          "name": "supportedChainId",
          "type": "u8"
        },
        {
          "name": "supported",
          "type": "bool"
        }
      ]
    },
    {
      "name": "addOrUpdateChainToken",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The account paying for all rents"
          ]
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "supportedChainConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenConfig",
          "isMut": true,
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
          "name": "chainId",
          "type": "u8"
        },
        {
          "name": "supportedChainId",
          "type": "u8"
        },
        {
          "name": "tokenId",
          "type": "u8"
        },
        {
          "name": "tokenFeePercentages",
          "type": "u64"
        },
        {
          "name": "tokenMinAmount",
          "type": "u64"
        },
        {
          "name": "withdrawPaused",
          "type": "bool"
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
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
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
          "name": "chianId",
          "type": "u8"
        },
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
        }
      ]
    },
    {
      "name": "addOrUpdateCommittee",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "committeeConfig",
          "isMut": true,
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
          "name": "chianId",
          "type": "u8"
        },
        {
          "name": "committee",
          "type": "publicKey"
        },
        {
          "name": "stake",
          "type": "u16"
        },
        {
          "name": "isBlocklisted",
          "type": "bool"
        }
      ]
    },
    {
      "name": "addOrUpdateSubmitter",
      "accounts": [
        {
          "name": "payer",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
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
          "name": "chianId",
          "type": "u8"
        },
        {
          "name": "isSubmitter",
          "type": "bool"
        }
      ]
    },
    {
      "name": "mintSbtcWithSignatures",
      "accounts": [
        {
          "name": "submitter",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The submitter calls it"
          ]
        },
        {
          "name": "submitterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bridgeConfig",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "1. load BridgeConfig"
          ]
        },
        {
          "name": "supportedChainConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false,
          "docs": [
            "the user to receive minted sBTC"
          ]
        },
        {
          "name": "limiter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionsSysvar",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "numberOfSignatures",
          "type": "u8"
        },
        {
          "name": "msg",
          "type": {
            "defined": "MintSbtcMessage"
          }
        }
      ]
    },
    {
      "name": "withdrawBtc",
      "accounts": [
        {
          "name": "user",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false,
          "docs": [
            "1. load BridgeConfig"
          ]
        },
        {
          "name": "supportedChainConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "associatedTokenProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
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
          "name": "msg",
          "type": {
            "defined": "WithdrawBtcMessage"
          }
        }
      ]
    },
    {
      "name": "addOrUpdateLimiterWithSignatures",
      "accounts": [
        {
          "name": "submitter",
          "isMut": true,
          "isSigner": true,
          "docs": [
            "The submitter calls it"
          ]
        },
        {
          "name": "submitterAccount",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "bridgeConfig",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "supportedChainConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "tokenConfig",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "nonce",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "limiter",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "instructionsSysvar",
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
          "name": "numberOfSignatures",
          "type": "u8"
        },
        {
          "name": "msg",
          "type": {
            "defined": "UpdateLimiterMsg"
          }
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
            "type": "publicKey"
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
                10
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
            "name": "submitter",
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
                10
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
            "name": "withdrawPaused",
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
            "name": "sbtcMint",
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
                10
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
            "name": "withdrawPaused",
            "type": "bool"
          },
          {
            "name": "tokenId",
            "type": "u8"
          },
          {
            "name": "chainId",
            "type": "u8"
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
            "name": "tokenFeePercentage",
            "type": "u64"
          },
          {
            "name": "tokenMinAmount",
            "type": "u64"
          },
          {
            "name": "mintTotal",
            "type": "u128"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                10
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
            "name": "mintTotal",
            "type": "u128"
          },
          {
            "name": "padding",
            "docs": [
              "padding"
            ],
            "type": {
              "array": [
                "u64",
                10
              ]
            }
          }
        ]
      }
    },
    {
      "name": "nonces",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "isInitialized",
            "type": "bool"
          },
          {
            "name": "nonce",
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
                10
              ]
            }
          }
        ]
      }
    },
    {
      "name": "chainTokenLimiter",
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
            "name": "tokenId",
            "type": "u8"
          },
          {
            "name": "totalLimit",
            "type": "u64"
          },
          {
            "name": "oldestHour",
            "type": "u32"
          },
          {
            "name": "hourlyTransfers",
            "type": {
              "array": [
                "u64",
                24
              ]
            }
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "MintSbtcMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "messageType",
            "type": "u8"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "sourceChainId",
            "type": "u8"
          },
          {
            "name": "sourceTokenId",
            "type": "u8"
          },
          {
            "name": "fromAddress",
            "type": "bytes"
          },
          {
            "name": "toChainId",
            "type": "u8"
          },
          {
            "name": "toAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UpdateLimiterMsg",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "messageType",
            "type": "u8"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "targetChainId",
            "type": "u8"
          },
          {
            "name": "tokenId",
            "type": "u8"
          },
          {
            "name": "totalLimit",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "WithdrawBtcMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "messageType",
            "type": "u8"
          },
          {
            "name": "version",
            "type": "u8"
          },
          {
            "name": "nonce",
            "type": "u64"
          },
          {
            "name": "toChainId",
            "type": "u8"
          },
          {
            "name": "toTokenId",
            "type": "u8"
          },
          {
            "name": "toAddress",
            "type": "bytes"
          },
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "fromAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "UpdateSupportedChainMessage",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chainId",
            "type": "u8"
          },
          {
            "name": "supported",
            "type": "bool"
          }
        ]
      }
    },
    {
      "name": "TokenTransferPayload",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "senderAddressLength",
            "type": "u8"
          },
          {
            "name": "senderAddress",
            "type": "bytes"
          },
          {
            "name": "targetChain",
            "type": "u8"
          },
          {
            "name": "recipientAddressLength",
            "type": "u8"
          },
          {
            "name": "recipientAddress",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "tokenId",
            "type": "u8"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "Operation",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "TokenTransfer"
          },
          {
            "name": "Blocklist"
          },
          {
            "name": "EmergencyOp"
          },
          {
            "name": "UpdateBridgeLimit"
          },
          {
            "name": "UpdateTokenPrice"
          },
          {
            "name": "Upgrade"
          },
          {
            "name": "AddEvmTokens"
          },
          {
            "name": "UpdateChainId"
          }
        ]
      }
    }
  ],
  "events": [
    {
      "name": "LimitUpdated",
      "fields": [
        {
          "name": "chainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "tokenId",
          "type": "u8",
          "index": false
        },
        {
          "name": "totalLimit",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "LimitEvent",
      "fields": [
        {
          "name": "currentH",
          "type": "u32",
          "index": false
        },
        {
          "name": "currentSlot",
          "type": "u8",
          "index": false
        },
        {
          "name": "totalBefore",
          "type": "u64",
          "index": false
        },
        {
          "name": "totalAfter",
          "type": "u64",
          "index": false
        }
      ]
    },
    {
      "name": "MintSbtcEvent",
      "fields": [
        {
          "name": "messageType",
          "type": "u8",
          "index": false
        },
        {
          "name": "version",
          "type": "u8",
          "index": false
        },
        {
          "name": "nonce",
          "type": "u64",
          "index": false
        },
        {
          "name": "sourceChainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "sourceTokenId",
          "type": "u8",
          "index": false
        },
        {
          "name": "fromAddress",
          "type": "bytes",
          "index": false
        },
        {
          "name": "toChainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "toAddress",
          "type": {
            "array": [
              "u8",
              32
            ]
          },
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "chainMintTotal",
          "type": "u128",
          "index": false
        },
        {
          "name": "tokenMintTotal",
          "type": "u128",
          "index": false
        }
      ]
    },
    {
      "name": "WithdrawBtctcEvent",
      "fields": [
        {
          "name": "messageType",
          "type": "u8",
          "index": false
        },
        {
          "name": "version",
          "type": "u8",
          "index": false
        },
        {
          "name": "nonce",
          "type": "u64",
          "index": false
        },
        {
          "name": "toChainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "toTokenId",
          "type": "u8",
          "index": false
        },
        {
          "name": "toAddress",
          "type": "bytes",
          "index": false
        },
        {
          "name": "chainId",
          "type": "u8",
          "index": false
        },
        {
          "name": "fromAddress",
          "type": {
            "array": [
              "u8",
              32
            ]
          },
          "index": false
        },
        {
          "name": "amount",
          "type": "u64",
          "index": false
        },
        {
          "name": "chainMintTotal",
          "type": "u128",
          "index": false
        },
        {
          "name": "tokenMintTotal",
          "type": "u128",
          "index": false
        }
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "InsufficientStake",
      "msg": "Insufficient Stake"
    },
    {
      "code": 6001,
      "name": "InvalidMessageType",
      "msg": "Invalid Message Type"
    },
    {
      "code": 6002,
      "name": "InvalidOpCode",
      "msg": "Invalid Op Code"
    },
    {
      "code": 6003,
      "name": "InvalidSupportedTokenAddresses",
      "msg": "Invalid Supported Token Addresses"
    },
    {
      "code": 6004,
      "name": "InvalidChain",
      "msg": "Invalid Chain"
    },
    {
      "code": 6005,
      "name": "InvalidTokenFeePercentage",
      "msg": "Invalid Token Fee Percentage"
    },
    {
      "code": 6006,
      "name": "InvalidIdsLength",
      "msg": "Invalid Ids Length"
    },
    {
      "code": 6007,
      "name": "InvalidTokenMinimumAmount",
      "msg": "Invalid Token Minimum Amount"
    },
    {
      "code": 6008,
      "name": "InvalidTokenIds",
      "msg": "Invalid Token Ids"
    },
    {
      "code": 6009,
      "name": "InvalidAdminAddress",
      "msg": "Invalid Admin Address"
    },
    {
      "code": 6010,
      "name": "InvalidFeeRecipientAddress",
      "msg": "Invalid Fee Recipient Address"
    },
    {
      "code": 6011,
      "name": "CannotSupportSelf",
      "msg": "Cannot Support Self"
    },
    {
      "code": 6012,
      "name": "TokenConfigAddressMissing",
      "msg": "Token Config Address Missing"
    },
    {
      "code": 6013,
      "name": "SupportedChainAddressMissing",
      "msg": "Token Config Address Missing"
    },
    {
      "code": 6014,
      "name": "DeserializeAirdropMessageError",
      "msg": "Deserialize Airdrop Message Error"
    },
    {
      "code": 6015,
      "name": "DeserializeWhitelistMessageError",
      "msg": "Deserialize Whitelist Message Error"
    },
    {
      "code": 6016,
      "name": "DeserializationError",
      "msg": "Deserialization Error"
    },
    {
      "code": 6017,
      "name": "BridgeConfigSerializationError",
      "msg": "Bridge Config Serialization Error"
    },
    {
      "code": 6018,
      "name": "SupportedChainSerializationError",
      "msg": "Supported Chain Serialization Error"
    },
    {
      "code": 6019,
      "name": "CommitteeLengthExceedsLimit",
      "msg": "Committee Length Exceeds Limit"
    },
    {
      "code": 6020,
      "name": "CommitteeAndStakeLengthMismatch",
      "msg": "Committee And Stake Length Mismatch"
    },
    {
      "code": 6021,
      "name": "InsufficientTotalStake",
      "msg": "Insufficient Total Stake"
    },
    {
      "code": 6022,
      "name": "CommitteeConfigAddressMissing",
      "msg": "Committee Config Address Missing"
    },
    {
      "code": 6023,
      "name": "BridgeCommitteeSerializationError",
      "msg": "Bridge Committee Serialization Error"
    },
    {
      "code": 6024,
      "name": "SubmitterConfigAddressMissing",
      "msg": "Submitter Config Address Missing"
    },
    {
      "code": 6025,
      "name": "Expired",
      "msg": "Expired"
    },
    {
      "code": 6026,
      "name": "InvalidPayloadLength",
      "msg": "InvalidPay load Length"
    },
    {
      "code": 6027,
      "name": "FailedToParseTokenPrice",
      "msg": "Failed To  Parse Token Price"
    },
    {
      "code": 6028,
      "name": "InsufficientSignatures",
      "msg": "Insufficient Signatures"
    },
    {
      "code": 6029,
      "name": "DeserializeMessageError",
      "msg": "Deserialize Message Error"
    },
    {
      "code": 6030,
      "name": "MessageMismatch",
      "msg": "Message Mismatch"
    },
    {
      "code": 6031,
      "name": "SupportedChainNotInitialized",
      "msg": "Supported Chain Not Initialized"
    },
    {
      "code": 6032,
      "name": "MessageOpTypeMismatch",
      "msg": "Message Op Type Mismatch"
    },
    {
      "code": 6033,
      "name": "BridgeConfigNotInitialized",
      "msg": "Bridge Config Not Initialized"
    },
    {
      "code": 6034,
      "name": "SupportedChainConfigNotInitialized",
      "msg": "Supported Chain Config Not Initialized"
    },
    {
      "code": 6035,
      "name": "TokenConfigNotInitialized",
      "msg": "Token Config Not Initialized"
    },
    {
      "code": 6036,
      "name": "SupportedChainConfigNoSupported",
      "msg": "Supported Chain Config Not Supported"
    },
    {
      "code": 6037,
      "name": "ChainIdMismatch",
      "msg": "Chain Id Mismatch"
    },
    {
      "code": 6038,
      "name": "DuplicateSignature",
      "msg": "Duplicate Signature"
    },
    {
      "code": 6039,
      "name": "SubmitterNotInitialized",
      "msg": "Submitter Not Initialized"
    },
    {
      "code": 6040,
      "name": "NotSubmitter",
      "msg": "Not A Submitter"
    },
    {
      "code": 6041,
      "name": "SigVerificationFailed",
      "msg": "Signature verification failed"
    },
    {
      "code": 6042,
      "name": "InstructionMissing",
      "msg": "InstructionMissing"
    },
    {
      "code": 6043,
      "name": "InvalidSigner",
      "msg": "Invalid Signer"
    },
    {
      "code": 6044,
      "name": "InvalidNonce",
      "msg": "Invalid Nonce"
    },
    {
      "code": 6045,
      "name": "WithdrawPaused",
      "msg": "Withdraw Paused"
    },
    {
      "code": 6046,
      "name": "BridgeWithdrawPaused",
      "msg": "Bridge Withdraw Paused"
    },
    {
      "code": 6047,
      "name": "InvalidAddress",
      "msg": "Invalid Address"
    },
    {
      "code": 6048,
      "name": "InvalidMinAmount",
      "msg": "Invalid Min Amount"
    },
    {
      "code": 6049,
      "name": "InvalidUserAddress",
      "msg": "Invalid User Address"
    },
    {
      "code": 6050,
      "name": "InvalidFeeRecipient",
      "msg": "Invalid Fee Recipient"
    },
    {
      "code": 6051,
      "name": "LackTargetMint",
      "msg": "Lack Target Mint"
    },
    {
      "code": 6052,
      "name": "ChainIdShouldDiffFromSolanaChainId",
      "msg": "ChainId Should Diff From Solana Chain Id"
    },
    {
      "code": 6053,
      "name": "AccountNotFound",
      "msg": "AccountNotFound"
    },
    {
      "code": 6054,
      "name": "FeeRecipientNotFound",
      "msg": "Fee Recipient Not Found"
    },
    {
      "code": 6055,
      "name": "FeeRecipientSbtcAtaNotFound",
      "msg": "Fee Recipient Sbtc Ata Not Found"
    },
    {
      "code": 6056,
      "name": "UserAccountNotFound",
      "msg": "User Account Not Found"
    },
    {
      "code": 6057,
      "name": "UserSbtcAtaNotFound",
      "msg": "User Sbtc Ata Not Found"
    },
    {
      "code": 6058,
      "name": "SbtcMintAccountNotFound",
      "msg": "Sbtc Mint Account Not Found"
    },
    {
      "code": 6059,
      "name": "TimeError",
      "msg": "Time Error"
    },
    {
      "code": 6060,
      "name": "TransferLimitExceeded",
      "msg": "Transfer Limit Exceeded"
    },
    {
      "code": 6061,
      "name": "BiggerThanFeeDenominator",
      "msg": "Bigger Than Fee Denominator"
    },
    {
      "code": 6062,
      "name": "UserNotFound",
      "msg": "User Not Found"
    }
  ]
};
