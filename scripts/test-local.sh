#!/bin/bash

# 启动 Solana 本地节点并屏蔽日志输出
yarn node:local > /dev/null 2>&1 & 
echo $! > .solana-test.pid

# 等待本地节点启动
wait-on tcp:8899

# 执行 Airdrop 和测试
yarn airdrop
yarn test-in-local-validator

# 记录测试状态码
exit_code=$?

# 终止 Solana 本地节点
kill $(cat .solana-test.pid)
rm -f .solana-test.pid

# 返回原始测试状态码
exit $exit_code
kill -9 $(lsof -ti:8899) && kill -9 $(lsof -ti:9900)
