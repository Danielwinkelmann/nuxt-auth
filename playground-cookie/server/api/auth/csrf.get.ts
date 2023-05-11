import { randomUUID } from 'uncrypto'

export default eventHandler((event) => {
  const csrfToken = randomUUID()
  setCookie(event, 'XSRF-TOKEN', csrfToken, { maxAge: 30 * 60 })
  return { csrfToken }
})
