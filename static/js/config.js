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
        url:'http://s0.t.hmny.io:9500/'
      },
      {
        name:'Pangaea',
        url:'http://s0.pga.hmny.io:9500/'
      },
      {
        name:'Harmony betanet',
        url:'http://s0.b.hmny.io:9500/'
      },
      // {
      //   name:'Harmony',
      //   url:'https://api.s1.t.hmny.io/'
      // },
      // {
      //   name:'Pangaea',
      //   url:'https://api.s1.pga.hmny.io/'
      // },
      // {
      //   name:'Harmony betanet',
      //   url:'https://api.s1.b.hmny.io/'
      // },
      {
        name:'Localhost',
        url:'http://127.0.0.1:9500'
      }
    ]
  },
  domain: 'http://localhost/'
}
