export default defineNuxtConfig({
  modules: ['../src/module.ts'],
  build: {
    transpile: ['jsonwebtoken']
  },
  auth: {
    provider: {
      type: 'cookie',
      cookie: {
        name: 'XSRF-TOKEN'
      },
      endpoints: {
        getSession: { path: '/user' },
        csrf: { path: '/csrf', method: 'get' }
      },
      pages: {
        login: '/'
      },
      token: {
        signInResponseTokenPointer: '/token/XSRF-TOKEN',
        maxAgeInSeconds: 30 * 60
      }
    },
    globalAppMiddleware: {
      isEnabled: true
    }
  }
})
