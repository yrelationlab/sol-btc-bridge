# PRD

logic from solidty 

## Memoo Manage

### CreateMeme

input:
1. name
2. symbol
3. totalSupply
4. decimal
5. payToken (default sol)
6. ido price
7. airdrop price
8. preLaunchSecond
9. idoUserBuyLimit

config:
1. memeFactory
2. platformFeeCreateMemePayToken (default sol)
3. platformFeeCreateMeme
```ts
    struct MemooConfig {
        address memeFactory;
        address treasury;
        address memeWhitelist;
        address uniswapV2Factory;
        address uniswapV2Router02;
        uint256 uniswapDeadline;
        address liquidityHolder;
        address liquidityLocker;
        address platformMemeRecipient; // platform meme 3%
        address payable platformFeeRecipient; // createFee, idoFee
        uint256 platformFeeRateIdo;  // 1 of 1/7
        uint256 platformFeeRateDenominatorIdo;  // 7 of 1/7
        uint256 platformFeeCreateMeme; // the fee of create meme
        address platformFeeCreateMemePayToken; // the fee pay token of create meme
        uint256 idoCreatorBuyLimit; // 3000
        TokenAllocation allocation;
    }
```

logic:
1. create meme
2. reduce fee
3. ido buy

### idoBuy

input:
1. memeConfigInfo
2. name
3. amount

config:
1. creator (在没开始的的时候，只有创建者可以买，预售开始后，其他人才可以买）
2. memeCreateTimestamp
3. preLaunchSecond
4. idoPrice
5. decimals
6. totalSupply
7. payToken

基数按照10000来算
```ts
   struct TokenAllocation {
        uint256 creator; // 500
        uint256 ido; // 3500
        uint256 lp; // 5500
        uint256 airdrop; // 200
        uint256 platform; // 300
    }
```

logic:
1. creator 在preLaunchSecond前可以买，其他人在这个时间后可以买
2. 购买的总数count = amount（msg.value）*10^decimal/idoPrice
3. idoTotal = memeConfigInfo.memeInfo.totalSupply * memeConfigInfo.memooConfig.allocation.ido / PERCENT_DENOMINATOR;
4. require(memeIdoCountMap[meme] + count <= idoTotal, "ido no enough quota");
5. 检查是否买超过了，创建者和个人用户不同
6. 把钱转到treasury
7. 更新此次购买记录
```ts
memeIdoAmountMap[meme] += amount;
memeUserIdoCount[meme][msg.sender] += count;
memeIdoCountMap[meme] += count;
```
8. 记录日志 
```ts
      emit MemeIdoBought({
            meme: meme,
            user: _msgSender(),
            amount: amount,
            count: count
        });
```
9. 如果达到结束IDO条件，购买的总值超过，则结束
```ts
   // sold out ido end
        if (memeIdoCountMap[meme] >= idoTotal) {
            _idoEnd(meme);
        }
```

### idoEnd
logic：
1. 必须有人买了 require(memeIdoAmountMap[meme] > 0, "ido amount must > 0");
2. burn ido rest meme
3. create LP
4. transfer platform fee
5. 保存货币对信息 memePoolMap
6. 发出事件 MemeIdoEnded


### idoClaim
1. require(memePoolMap[meme].pair != address(0), "ido not ended");
2. 创建者有可以claim的东西  require(memeUserIdoCount[meme][_msgSender()] > memeUserIdoClaimedCount[meme][_msgSender()], "claimed");
3. claim的次数记录一下，因为有两次
4. 发出事件

### airdropClaim
1. 检查claim签名是否是服务端发送的
2. 检查数量（去掉，一次性claim所有）
3. 检查允许claim的数量是不是超过了配置的最大上限
4. 检查付钱够不够
5. 记录claim的数量（如果有2）
6. 发出事件AirdropClaimed
      
### unlockPriceReached
1. 解锁（只有平台可以调用）
2. 发出解锁事件


### unlockMeme
1. unlockPriceReached发生后unlockMeme就可以发生
2. 用户，平台，创建者都可以unlock
```
      _unlockMeme(memeConfigInfo, unlockPeriod, meme, _msgSender());
        _unlockMeme(memeConfigInfo, unlockPeriod, meme, creator);
        _unlockMeme(memeConfigInfo, unlockPeriod, meme, platform);
```
### setUnlockPeriod

我理解的业务就是：
|流程|对应函数| 触发条件|
|---|---| --- |
|1. 创建meme | createMeme | 充钱就可以 |
|2. ido | idoBuy，idoEnd，idoClaim | 卖完了，有人买（服务端权限，3天后） |
|2.1 线下kol 操作， prelaunch | 无 | 配合2的操作 |
|4. 用户参与 airdrop | airdropClaim | 服务端给签名，没超过数量限制，免费（减少逻辑）|
|5. creator claim| unlockMeme | 不太清楚目前为啥逻辑这么复杂 |

问题：unlockMeme 条件 ：价格和天数两种，
这里的unlockPriceReached为啥有index和timestamp
setUnlockPeriod 可以设置 下面两种，
这里组合起来怎么用？测试里面index是0，1，

```
const unlockPeriods = [
          {index: 0, periodType: TYPE_PRICE, value: toWei(memeUnlockPrice), unlockRate: 5000},
          {index: 1, periodType: TYPE_DAYS, value: 60, unlockRate: 5000},
      ];        
```
