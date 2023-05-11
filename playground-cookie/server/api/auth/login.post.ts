import z from 'zod'

export default eventHandler(async (event) => {
  const result = z.object({ username: z.string().min(1), password: z.literal('hunter2') }).safeParse(await readBody(event))
  if (!result.success) {
    throw createError({ statusCode: 403, statusMessage: 'Unauthorized, hint: try `hunter2` as password' })
  }

  const cookies = parseCookies(event)
  const token = cookies['XSRF-TOKEN']

  if (!token) { throw createError({ statusCode: 403, statusMessage: 'Unauthorized, missing XSRF-TOKEN' }) }

  const { username } = result.data
  const user = {
    username,
    picture: 'https://github.com/nuxt.png',
    name: 'User ' + username
  }

  return {
    user,
    token: {
      'XSRF-TOKEN': token
    }
  }
})
