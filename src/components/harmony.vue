<template>
  <div :class="{webwallet:account}">
    <web-nav :blockchain="blockchain" :account="account" :shardNodes="nodes" @changeUrl="changeUrl"></web-nav>
    <login v-if="!account" @sendAccount="getAccount" :blockchain="blockchain"></login>
    <template v-else>
      <side-bar
        :balances="balances"
        :account="account"
        :blockchain="blockchain"
        :shards="shardArray"
        :loadingBalance="loadingBalance"
        @getFromShard="getFromShard"
        @balanceUpdate="balanceUpdate"
      ></side-bar>
      <section class="main-info">
        <div class="main-container transfer-container">
          <div class="tabs">
            <!-- 转账tab -->
            <a class="tab">{{$t("transfer")}}</a>
            <a
              class="tab"
              target="_blank"
              v-bind="{explorerLink}"
              :href="explorerLink.txOnShard"
            >{{$t("webwallet_transactions")}}</a>
          </div>
          <!-- 转账内容 -->
          <div class="transfer">
            <form class="basic-form">
              <!-- 接收地址 -->
              <ul class="basic-group clearfix">
                <li class="amount">
                  <!-- 转账金额 -->
                  <label>{{$t("webwallet_to_address")}}</label>
                  <input
                    type="text"
                    :placeholder="$t('webwallet_to_address_pl')"
                    v-model="transfer.account"
                  />
                </li>
                <li class="token">
                  <!-- Shard -->
                  <label>Shard</label>
                  <select v-model="toShard">
                    <option
                      v-for="item in shardArray"
                      :value="item.shardID"
                      :key="item.shardID"
                    >{{item.shardID}}</option>
                  </select>
                </li>
              </ul>
              <ul class="basic-group clearfix">
                <li class="amount">
                  <!-- 转账金额 -->
                  <label>{{$t("transfer_amount")}}</label>
                  <input type="text" placeholder="0" v-model="transfer.amount" />
                </li>
                <li class="token">
                  <!-- Token -->
                  <label>Token</label>
                  <select v-model="transfer.token">
                    <option v-for="item in values" :value="item" :key="item">{{item}}</option>
                  </select>
                </li>
              </ul>
              <div class="fee-set">
                <!-- 手续费 -->
                <label>{{$t("webwallet_fee")}}</label>
                <label
                  v-show="selectedSet==2"
                  class="setBtn"
                  @click="setToggle(1)"
                >{{$t("webwallet_simple")}}</label>
                <label
                  v-show="selectedSet==1"
                  class="setBtn"
                  @click="setToggle(2)"
                >{{$t("webwallet_advanced")}}</label>
                <!-- 普通设置 -->
                <ul v-show="selectedSet==1" class="basic-group clearfix">
                  <li class="amount slider" ref="slider">
                    <div class="thunk" :style="{left}" ref="thunk">
                      <div class="block">
                        <img src="static/img/icons/slider@2x.png" width="16" />
                      </div>
                    </div>
                    <div class="cheap">{{$t("webwallet_cheap")}}</div>
                    <div class="fast">{{$t("webwallet_fast")}}</div>
                  </li>
                  <li class="token">
                    <div class="input">{{transfer.fee.toFixed(6)}} ONE</div>
                  </li>
                </ul>
                <!-- 高级设置 -->
                <ul class="basic-group clearfix" v-show="selectedSet==2">
                  <li class="gas-price">
                    <span>Gas Price (Gwei)</span>
                    <input type="text" placeholder="0" v-model="transfer.gasPrice" />
                  </li>
                  <li class="gas-limit">
                    <span>Gas Limit (Units)</span>
                    <input type="text" placeholder="0" v-model="transfer.gasLimit" />
                  </li>
                  <li class="token">
                    <div class="input">{{feeCompute.toFixed(6)}} ONE</div>
                  </li>
                </ul>
              </div>
              <!-- input数据 -->
              <div class="input-data">
                <label>{{$t("input_data")}}</label>
                <textarea
                  cols="50"
                  rows="3"
                  :placeholder="$t('transfer_input')"
                  v-model="transfer.input"
                ></textarea>
              </div>
              <!--<a class="btn" @click="sendTransfer">{{$t("transfer")}}</a>-->
              <a class="btn" v-if="!transferring" @click="sendTransfer">{{$t("transfer")}}</a>
              <button class="btn" v-else disabled ="disabled" >{{$t('transferring')}}</button>
            </form>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>
<script>
import webNav from "base/nav";
import login from "base/login";
import sideBar from "base/sidebar";
import common from "static/js/common.js";
import BigNumber from "static/js/bignumber.mjs";
import { HarmonyExtension } from "@harmony-js/core";
import {
  ChainType,
  hexToNumber,
  Unit,
  isValidAddress
} from "@harmony-js/utils";
import { fromBech32, getAddress } from "@harmony-js/crypto";
export default {
  data() {
    return {
      url: "", // 用于初始化的rpcUrl
      blockchain: "Harmony",
      account: "",
      transfer: {
        account: "",
        amount: 0,
        token: "ONE",
        fee: 0.00042,
        gasPrice: "20",
        gasLimit: 21000,
        input: ""
      },
      fromShard: 0,
      toShard: 0,
      unit: this.webCoin.unit,
      harmonyExt: undefined,
      // 增加chainId属性
      chainId: 1,
      loadingBalance: false,
      selectedSet: 1,
      decimal: 18,
      slider: null, //滚动条DOM元素
      thunk: null, //拖拽DOM元素
      progress: {
        per: 8, //当前值
        min: 1,
        max: 20
      },
      values: [],
      coin: {
        cny: 0,
        usd: 0,
        krw: 0
      },
      balances: {
        sum: 0,
        USD: 0,
        CNY: 0,
        KRW: 0,
        list: {}
      },
      timer: "",
      shardArray: [], // 用于存储拉取到的分片信息
      nodes: this.globalData.harmony.nodes,
      explorerLink: {
        address: "",
        txOnShard: "",
        txDetail: ""
      },
      transferring: false
    };
  },
  created() {
    this.dropdownToken();
    this.getAccount();
    this.getShard();
  },
  mounted() {
    this.getUnit();
  },
  computed: {
    // 设置一个百分比，提供计算slider进度宽度和trunk的left值
    // 对应公式为  当前值-最小值/最大值-最小值 = slider进度width / slider总width
    // trunk left =  slider进度width + trunk宽度/2
    scale() {
      return (
        (this.progress.per - this.progress.min) /
        (this.progress.max - this.progress.min)
      );
    },
    width() {
      if (this.slider) {
        return this.slider.offsetWidth * this.scale + "px";
      } else {
        return 0 + "px";
      }
    },
    left() {
      if (this.slider) {
        var left =
          this.slider.offsetWidth * this.scale - this.thunk.offsetWidth / 2;

        if (left <= 0) {
          left = 0;
        } else if (left >= this.slider.offsetWidth - this.thunk.offsetWidth) {
          left = this.slider.offsetWidth - this.thunk.offsetWidth;
        }
        return left + "px";
      } else {
        return "0px";
      }
    },
    feeCompute() {
      if (this.transfer.gasPrice == "" || this.transfer.gasLimit == "") {
        return 0;
      }
      let gasPrice = new BigNumber(this.transfer.gasPrice + "");
      let limit = new BigNumber(this.transfer.gasLimit + "");
      return gasPrice.div(Math.pow(10, 9)).times(limit);
    }
  },
  watch: {
    toShard(newValue, oldValue) {
      if (this.webUtil.getSession("toShard") != newValue) {
        this.webUtil.setSession("toShard", newValue);
      }
    }
  },
  methods: {
    // 字符串转16进制
    stringToHex(str) {
      if (str === "") {
        return "";
      }
      let arr = [];
      arr.push("0x");
      for (let i = 0; i < str.length; i++) {
        arr.push(str.charCodeAt(i).toString(16));
      }
      return arr.join("");
    },
    getAccount() {
      if (this.webUtil.getCookie("identity_harmony")) {
        this.account = JSON.parse(this.webUtil.getCookie("identity_harmony"));
        this.initExtension();
        // this.timerFunc();
      }
    },
    getUnit() {
      // 用$on事件来接收参数
      common.$on("val", data => {
        this.unit = data;
      });
    },
    setToggle(val) {
      this.selectedSet = val;
    },
    // 获取当前网络
    getExplorerLink() {
      let shard = JSON.parse(this.webUtil.getSession("shard"));
      let name = JSON.parse(shard).name;
      let fromShard = this.fromShard;
      let basic = "";

      const address = isValidAddress(this.account)
        ? getAddress(this.account).bech32
        : "";
      switch (name) {
        case "Harmony": {
          basic = "https://explorer.harmony.one/#";
          break;
        }
        case "Pangaea": {
          basic = "https://explorer.pangaea.harmony.one/#";
          break;
        }
        case "Harmony Testnet": {
          basic = "https://explorer.beta.harmony.one/#";
          break;
        }
        case "Local": {
          basic = "";
          break;
        }
        default: {
          basic = "";
          break;
        }
      }
      this.explorerLink = {
        address: `${basic}/address/`,
        txOnShard: `${basic}/address/${address}/shard/${fromShard}`,
        txDetail: `${basic}/tx/`
      };
    },
    progressSlide() {
      this.slider = this.$refs.slider;
      this.thunk = this.$refs.thunk;
      let _this = this;
      this.transfer.fee = 0.00252 * (this.progress.per / this.progress.max);
      this.thunk.onmousedown = function(e) {
        let width = parseInt(_this.width);
        let disX = e.clientX;
        document.onmousemove = function(e) {
          // value, left, width
          // 当value变化的时候，会通过计算属性修改left，width

          // 拖拽的时候获取的新width
          let newWidth = e.clientX - disX + width;
          // 拖拽的时候得到新的百分比
          let scale = newWidth / _this.slider.offsetWidth;
          let max = _this.progress.max;
          let min = _this.progress.min;

          _this.progress.per = Math.ceil((max - min) * scale + min);
          _this.progress.per = Math.max(_this.progress.per, min);
          _this.progress.per = Math.min(_this.progress.per, max);
          _this.transfer.fee = 0.00252 * (_this.progress.per / max).toFixed(6);
        };
        document.onmouseup = function(e) {
          document.onmousemove = document.onmouseup = null;
        };
        return false;
      };
    },
    dropdownToken() {
      this.values.push("ONE");
    },
    getFromShard(param) {
      this.fromShard = param;
      this.shardArray.forEach(shard => {
        if (shard.shardID == param) {
          this.url = shard.http;
        }
      });
      this.getExplorerLink();
    },
    // 切换 shard
    changeUrl(param) {
      if (param) {
        this.url = param;
        // 切换节点同时初始化 fromShard和toShard
        this.webUtil.setSession("fromShard", 1);
        this.webUtil.setSession("toShard", 0);
        window.location.reload();
      }
    },
    // 获取fromShard,toShard
    getShard() {
      if (
        this.webUtil.getSession("fromShard") !== undefined &&
        this.fromShard === undefined &&
        this.webUtil.getSession("toShard") !== undefined
      ) {
        this.fromShard = this.webUtil.getSession("fromShard");
        this.toShard = this.webUtil.getSession("toShard");
      } else {
        this.webUtil.setSession("fromShard", this.fromShard);
        this.webUtil.setSession("toShard", 0);
      }
    },
    // 计算代币value
    getCoinValue() {
      this.balances.CNY = parseFloat(this.coin.cny) * parseFloat(this.balances.sum);
      this.balances.USD = parseFloat(this.coin.usd) * parseFloat(this.balances.sum);
      this.balances.KRW = parseFloat(this.coin.krw) * parseFloat(this.balances.sum);
    },
    initExtension() {
      this.webUtil.initMathExtension().then(res => {
        this.progressSlide();

        // 获取初始化url
        let shard = JSON.parse(this.webUtil.getSession("shard"));
        this.url = JSON.parse(shard).url;
        // 读取config里面每个node的chainId，
        // 并写入chainId属性
        this.chainId = JSON.parse(shard).chainId;

        let hexAddress = fromBech32(this.account, "one");
        // 使用HarmonyExtension进行初始化
        // 第二个参数为Object, {chainId:number,chainType:string,chainUrl:string}
        // 这里不使用chainUrl是因为每次切换shard都会刷新一次，干脆在后面使用setProvider
        // 这里传入对应的chainId
        this.harmonyExt = new HarmonyExtension(window.harmony, {
          chainId: this.chainId
        });
        let harmony = this.harmonyExt;

        harmony.setProvider(this.url);

        // 刷新balance：true
        this.loadingBalance = true;
        harmony.blockchain
          .getShardingStructure()
          .then(res => {
            if (res.result) {
              // 设置分片信息
              harmony.shardingStructures(res.result);
              // 存储分片信息 用于页面展示
              this.shardArray = res.result;
              this.fromShard = harmony.messenger.currentShard;
              this.getShard();
              this.getExplorerLink();
              // 获取余额
              let id = parseInt(this.fromShard);
              harmony.blockchain
                .getBalance({
                  address: hexAddress,
                  blockNumber: "latest",
                  shardID: id
                })
                .then(response => {
                  let result = response.result;
                  let balance = new BigNumber(hexToNumber(result) + "");
                  balance = balance.div(Math.pow(10, this.decimal)).toFixed();

                  this.$set(this.balances.list, "ONE", balance);
                  this.balances.sum = balance;
                  // 刷新balance：false
                  this.loadingBalance = false;
                  return this.balances.sum;
                })
                .then(sum => {
                  // 获取代币价格
                  this.getCoinPrice().then(() => {
                    // 计算代币value
                    this.getCoinValue();
                  });
                })
                .catch(err => {
                  console.log(err);
                });
            } else {
              this.$alert(this.$t("node_not_available")).then(() => {
                clearInterval(this.timer);
              });
            }
          })
          .catch(err => {
            console.log(err);
          });
      });
    },
    // 更新余额
    balanceUpdate() {
      let hexAddress = fromBech32(this.account, "one");

      let harmony = this.harmonyExt;

      // 这里也不需要再次设置shardingStructure了

      this.loadingBalance = true;
      let id = parseInt(this.fromShard);
      harmony.blockchain
        .getBalance({
          address: hexAddress,
          blockNumber: "latest",
          shardID: id
        })
        .then(response => {
          let result = response.result;
          let balance = new BigNumber(hexToNumber(result) + "");
          balance = balance.div(Math.pow(10, this.decimal)).toFixed();
          if (this.balances.list.ONE != balance) {
            this.$set(this.balances.list, "ONE", balance);
            this.balances.sum = balance;
          }
          this.loadingBalance = false;
          return this.balances.sum;
        })
        .then(sum => {
          this.getCoinPrice().then(() => {
            // 计算代币value
            this.getCoinValue();
          });
        })
        .catch(err => {
          console.log(err);
        });
    },
    async getCoinPrice() {
      // 获取ONE代币人民币价格
      await this.webUtil
        .getTokenPrice(this.globalData.domain, "ONE", "1001")
        .then(res => {
          this.coin.cny = parseFloat(res.last2Rmb);
          // 获取汇率
          this.webUtil.getCoinPub(this.globalData.domain).then(res => {
            // 计算美元韩元
            this.coin.usd = this.coin.cny / res.usd;
            this.coin.krw = this.coin.cny / res.krw;
          })
        });
    },
    // 设置gasPrice和gasLimit
    gasSimpleSet(fee) {
      // gasLimit默认为 25200
      this.gasLimit = "25200";
      // 计算gasPrice 以wei计算
      let tmp = new BigNumber(fee + "");
      this.gasPrice = tmp
        .div(this.gasLimit)
        .toFixed();
    },
    // sendTransfer() {
    //   if (!this.transfer.account) {
    //     this.$alert(this.$t("transfer_account_null"));
    //     return false;
    //   }
    //   if (this.transfer.amount == "" && this.transfer.amount != 0) {
    //     this.$alert(this.$t("transfer_amount_null"));
    //     return false;
    //   }
    //   if (
    //     this.transfer.amount < Math.pow(10, -this.decimal) &&
    //     this.transfer.amount != 0
    //   ) {
    //     this.$alert(
    //       this.$t("transfer_amount_min") +
    //         this.webUtil.getFullNum(Math.pow(10, -this.decimal))
    //     );
    //     return false;
    //   }
    //   // 判断转账数量
    //   if (parseFloat(this.transfer.amount) >= parseFloat(this.balances.sum)) {
    //     this.$alert(this.$t("webwallet_harmony_amount_notenough"));
    //     return false;
    //   }
    //
    //   // 计算gasPrice
    //   if (this.selectedSet == 1) {
    //     this.gasSimpleSet(this.transfer.fee);
    //   } else {
    //     if (!this.transfer.gasPrice) {
    //       this.$alert(this.$t("gas_limit_null"));
    //       return false;
    //     }
    //     if (!this.transfer.gasLimit) {
    //       this.$alert(this.$t("gas_price_null"));
    //       return false;
    //     }
    //     this.gasPrice = this.transfer.gasPrice;
    //     this.gasLimit = this.transfer.gasLimit;
    //   }
    //
    //   // 处理data
    //   let data = this.stringToHex(this.transfer.input);
    //
    //   // 判断插件是否存在
    //   if (!window.harmony || !this.harmonyExt.extensionType === null) {
    //     this.$alert(this.$t("noMathExtension"));
    //     return false;
    //   }
    //
    //   let harmony = this.harmonyExt;
    //   // 这里也不需要再次设置shardingStructure了
    //   // 调用登陆函数
    //   harmony.wallet.getAccount().then(res => {
    //     let account = res.address;
    //
    //     //判断插件选择账户和当前账户是否一致
    //     if (account != this.account) {
    //       this.$alert(this.$t("check_account"));
    //       return false;
    //     }
    //
    //     // 处理地址
    //     let from = account + "-" + this.fromShard;
    //     let to = this.transfer.account + "-" + this.toShard;
    //
    //     // 交易对象
    //     let transactionObj = {
    //       from: from,
    //       to: to,
    //       value: new Unit(this.transfer.amount).asEther().toWei().toString(),
    //       gasLimit: new Unit(this.gasLimit).asWei().toWei().toString(),
    //       gasPrice: new Unit(this.gasPrice).asEther().toWei().toString(),
    //       data: data
    //     };
    //
    //     console.log(transactionObj);
    //     console.log(this.gasPrice);
    //     return false;
    //
    //     let txn = harmony.transactions.newTx(transactionObj, true);
    //
    //     harmony.wallet
    //       .signTransaction(txn, true)
    //       .then(signed => {
    //         // 发送交易
    //         signed
    //           .sendTransaction()
    //           .then(res => {
    //             let [transaction, hash] = res;
    //             let url = this.explorerLink.txDetail + hash;
    //             if (hash) {
    //               this.$confirm({
    //                 content: "Hash: " + hash,
    //                 yesText: "Go",
    //                 noText: "Close"
    //               })
    //                 .then(success => {
    //                   if (success) {
    //                     // window.location.href = url;
    //                     window.open(url, "_blank");
    //                   }
    //                 })
    //                 .catch(err => {
    //                   if (err == "fail") {
    //                     // window.location.reload();
    //                   }
    //                   console.log(err);
    //                 });
    //             }
    //             transaction.confirm(hash).then(res => {
    //               console.log(res);
    //               if (res.txStatus == "CONFIRMED") {
    //                 this.balanceUpdate();
    //               }
    //             });
    //           })
    //           .catch(err => {
    //             console.log(err);
    //             this.$alert(this.$t("transfer_fail"));
    //           });
    //       })
    //       .catch(err => {
    //         console.log(err);
    //       });
    //   });
    // }

    sendTransfer() {
      if (!this.transfer.account) {
        this.$alert(this.$t("transfer_account_null"));
        return false;
      }
      if (this.transfer.amount == "" && this.transfer.amount != 0) {
        this.$alert(this.$t("transfer_amount_null"));
        return false;
      }
      if (
        this.transfer.amount < Math.pow(10, -this.decimal) &&
        this.transfer.amount != 0
      ) {
        this.$alert(
          this.$t("transfer_amount_min") +
          this.webUtil.getFullNum(Math.pow(10, -this.decimal))
        );
        return false;
      }

      // 判断转账数量
      if (parseFloat(this.transfer.amount) >= parseFloat(this.balances.sum)) {
        this.$alert(this.$t("webwallet_harmony_amount_notenough"));
        return false;
      }

      // 计算gasPrice
      if (this.selectedSet == 1) {
        this.gasSimpleSet(this.transfer.fee);
      } else {
        if (!this.transfer.gasPrice) {
          this.$alert(this.$t("gas_limit_null"));
          return false;
        }
        if (!this.transfer.gasLimit) {
          this.$alert(this.$t("gas_price_null"));
          return false;
        }
        this.gasPrice = this.transfer.gasPrice;
        this.gasLimit = this.transfer.gasLimit;
      }

      // 处理data
      let data = this.stringToHex(this.transfer.input);

      // 判断插件是否存在
      if (!window.harmony || !this.harmonyExt.extensionType === null) {
        this.$alert(this.$t("noMathExtension"));
        return false;
      }

      let harmony = this.harmonyExt;
      // 调用登陆函数
      harmony.wallet.getAccount().then(res => {
        let account = res.address;

        //判断插件选择账户和当前账户是否一致
        if (account != this.account) {
          this.$alert(this.$t("check_account"));
          return false;
        }

        this.transferring = true;

        // 处理地址
        let from = account + "-" + this.fromShard;
        let to = this.transfer.account + "-" + this.toShard;

        // 交易对象
        let transactionObj = {
          from: from,
          to: to,
          value: new Unit(this.transfer.amount).asEther().toWei(),
          gasLimit: new Unit(this.gasLimit).asWei().toWei().toString(),
          gasPrice: new Unit(this.gasPrice).asEther().toWei().toString(),
          data: data
        };

        let txn = harmony.transactions.newTx(transactionObj, true);

        harmony.wallet
          .signTransaction(txn, true)
          .then(signed => {
            // 发送交易
            signed
              .sendTransaction()
              .then(res => {
                let [transaction, hash] = res;
                console.log(transaction);

                let url = this.explorerLink.txDetail + hash;
                if (hash) {
                  this.$confirm({
                    content: "Hash: " + hash,
                    yesText: "Go",
                    noText: "Close"
                  })
                    .then(success => {
                      if (success) {
                        // window.location.href = url;
                        this.transferring = false;
                        window.open(url, "_blank");
                      }
                    })
                    .catch(err => {
                      if (err == "fail") {
                        // window.location.reload();
                        this.transferring = false;
                      }
                      console.log(err);
                    });
                }
                transaction.confirm(hash).then(res => {
                  console.log(res);
                  if (res.txStatus == "CONFIRMED") {
                    this.balanceUpdate();
                  }
                });
              })
              .catch(err => {
                console.log(err);
                this.$alert(this.$t("transfer_fail"));
                this.transferring = false;
              });
          })
          .catch(err => {
            console.log(err);
            this.$alert(this.$t("transfer_fail"));
            this.transferring = false;
          });
      });
    }
  },
  components: {
    sideBar,
    login,
    webNav
  }
};
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->

<style scoped>
.input-data textarea {
  width: 100%;
  border: 1px solid var(--pale-grey);
  padding: 12px;
  font-size: 16px;
  line-height: 1.5;
}
</style>
