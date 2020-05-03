export default {
  root: process.env.NODE_ENV === 'production' ? '/web' : '',
  harmony: {
    token: 'ONE',
    network: {
      blockchain: 'Harmony',
      chainId: ''
    },
    nodes:[
      {
        name:'Mainnet',
        url:'https://api.s0.t.hmny.io/',
        chainId: 1
      },
      {
        name:'Open Staking Testnet',
        url:'https://api.s0.os.hmny.io',
        chainId: 3
      },
      {
        name:'Long Running Testnet',
        url:'https://api.s0.b.hmny.io/',
        chainId: 2
      },
      {
        name:'Localhost',
        url:'http://127.0.0.1:9500',
        chainId: 4
      }
    ]
  },
  domain: 'http://localhost/'
}
