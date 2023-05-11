import { H3Event } from 'h3'

const ensureAuth = (event: H3Event) => {
  const cookies = parseCookies(event)
  const token = cookies['XSRF-TOKEN']

  if (!token) { throw createError({ statusCode: 403, statusMessage: 'Unauthorized, missing XSRF-TOKEN' }) }

  return {
    username: 'test',
    picture: 'https://github.com/nuxt.png',
    name: 'User ' + 'test'
  }
}

export default eventHandler((event) => {
  const user = ensureAuth(event)
  return { user }
})
