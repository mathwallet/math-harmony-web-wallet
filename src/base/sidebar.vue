<template>
  <div>
    <section class="user-info text-center">
      <div class="avator">
        <img :src="'static/img/chain/'+blockchain_lowercase+'_icon@2x.png'" width="100%" />
      </div>
      <h4>{{blockchain}} Wallet</h4>
      <p id="copyContent">{{account}}</p>
      <div class="shard" v-if="blockchain_lowercase=='harmony'">
        <label>Shard</label>
        <select v-model="shardID">
          <option v-for="item in shards" :value="item.shardID" :key="item.shardID">{{item.shardID}}</option>
        </select>
      </div>
      <div class="operation-list" v-bind:class="{shard_select:shard_selected}">
        <!-- 复制地址 -->
        <a
          class="grey-fsz"
          id="copyBtn"
          data-clipboard-target="#copyContent"
          data-clipboard-action="copy"
        >{{$t("webwallet_copy_address")}}</a>
        <a class="grey-fsz refresh" @click="refreshBalance">{{$t('webwallet_refresh_balance')}}</a>
      </div>

      <div class="token-info">
        <!-- 估值 -->
        <p>{{$t("webwallet_estimated_value")}}</p>
        <h4>{{loadingBalance?'---':webUtil.addCommas(balances.sum,5)}} {{token}}</h4>
        <p class="grey-fsz">≈ {{webUtil.addCommas(balances[unit])}} {{unit}}</p>
        <ul class="token-list">
          <li v-for="(item,index) in balances.list" :key="index">
            <div>{{index}}</div>
            <div>{{item?webUtil.addCommas(item,6):0}}</div>
          </li>
        </ul>
      </div>
    </section>
    <div class="refresh-logout">
      <!-- 刷新 -->
      <a class="grey-fsz refresh" @click="refresh">{{$t('webwallet_refresh')}}</a>
      <!-- 退出 -->
      <a class="grey-fsz logout" @click="logout">{{$t('webwallet_logout')}}</a>
    </div>
  </div>
</template>
<style scoped>
.shard {
  margin-top: 10px;
}
.shard label {
  margin-right: 8px;
}
.shard select {
  padding: 0 8px 0 22px;
  width: 60px;
  border-radius: 0;
  background: url("../../static/img/icons/dropdown_black@2x.png") no-repeat 44px
    center/12px;
}
.shard_select {
  margin-top: 10px !important;
}
</style>
<script>
import common from "static/js/common.js";
export default {
  props: ["account", "balances", "blockchain", "shards", "loadingBalance"],
  data() {
    return {
      unit: this.webCoin.unit,
      blockchain_lowercase: "",
      network: "",
      token: "",
      shardID: 0,
      shard_selected: false,
      time: ""
    };
  },
  created() {
    this.getChain();
    this.timerFunc();
  },
  mounted() {
    this.copyAddress();
    this.getUnit();
  },
  watch: {
    shardID(newValue, oldValue) {
      if (this.webUtil.getSession("fromShard") != newValue) {
        this.webUtil.setSession("fromShard", newValue);
        this.$emit("getFromShard", newValue);
        this.refreshBalance();
        // window.location.reload();
      }
    }
  },
  methods: {
    refresh() {
      window.location.reload();
    },
    refreshBalance() {
      console.log(this.loadingBalance);
      this.$emit("balanceUpdate");
    },
    getChain() {
      if (this.blockchain) {
        let blockchain = this.blockchain.toLowerCase();
        this.blockchain_lowercase = blockchain;
        this.network = this.globalData[blockchain].network;
        this.token = this.globalData[blockchain].token;
      }
      if (this.blockchain_lowercase == "harmony") {
        this.shard_selected = true;
      }
    },
    timerFunc() {
      this.time = setInterval(() => {
        this.shardID = this.webUtil.getSession("fromShard");
      }, 1000);
    },
    logout() {
      this.webUtil.setCookie("identity_" + this.blockchain_lowercase, "", {
        expires: -30,
        path: "/"
      });
      window.harmony.forgetIdentity();
      if (this.blockchain_lowercase == "harmony") {
        this.webUtil.delSession("fromShard");
        this.webUtil.delSession("toShard");
        this.webUtil.delSession("shard");
      }
      window.location.reload();
    },

    copyAddress() {
      var clipboard = new this.clipboard("#copyBtn");
      clipboard.on("success", element => {
        //复制成功的回调
        this.$toast(this.$t("copy_success"));
      });
      clipboard.on("error", element => {
        //复制失败的回调
        this.$toast(this.$t("copy_fail"));
      });
    },
    getUnit() {
      // 用$on事件来接收参数
      common.$on("val", data => {
        this.unit = data;
      });
    }
  }
};
</script>
