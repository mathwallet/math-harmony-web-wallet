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
        name:'Harmony',
        url:'https://api.s1.t.hmny.io/',
        chainId: 1
      },
      {
        name:'Pangaea',
        url:'https://api.s1.pga.hmny.io/',
        chainId: 3
      },
      {
        name:'Harmony betanet',
        url:'https://api.s1.b.hmny.io/',
        chainId: 2
      },
      {
        name:'Localhost',
        url:'http://127.0.0.1:9500',
        chainId: 2
      }
    ]
  },
  domain: 'http://localhost/'
}
