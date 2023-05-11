import { callWithNuxt } from '#app'
import { jsonPointerGet, useTypedBackendConfig } from '../../helpers'
import { useAuth as useLocalAuth } from '../local/useAuth'
import { _fetch } from '../../utils/fetch'
import { getRequestURLWN } from '../../utils/callWithNuxt'
import { SignOutFunc } from '../../types'
import { useAuthState } from './useAuthState'
import { navigateTo, nextTick, useNuxtApp, useRuntimeConfig } from '#imports'

const csrfRequest = async () => {
  const nuxt = useNuxtApp()
  const config = useTypedBackendConfig(useRuntimeConfig(), 'cookie')
  const { path, method } = config.endpoints.csrf
  return await _fetch<Record<string, any>>(nuxt, path, {
    method
  })
}

const signIn: ReturnType<typeof useLocalAuth>['signIn'] = async (credentials, signInOptions, signInParams) => {
  const nuxt = useNuxtApp()
  const { rawToken } = useAuthState()
  const { getSession } = useLocalAuth()
  const config = useTypedBackendConfig(useRuntimeConfig(), 'cookie')
  const { path, method } = config.endpoints.signIn

  // Ditch any leftover local tokens before attempting to log in
  rawToken.value = null

  // Make CSRF request if required
  if (config.endpoints.csrf) {
    await csrfRequest()
  }

  const response = await _fetch<Record<string, any>>(nuxt, path, {
    method,
    body: {
      ...credentials,
      ...(signInOptions ?? {})
    },
    params: signInParams ?? {}
  })

  const extractedToken = jsonPointerGet(response, config.token.signInResponseTokenPointer)
  if (typeof extractedToken !== 'string') {
    console.error(`Auth: string token expected, received instead: ${JSON.stringify(extractedToken)}. Tried to find token at ${config.token.signInResponseTokenPointer} in ${JSON.stringify(response)}`)
    return
  }

  rawToken.value = extractedToken

  await nextTick(getSession)

  const { callbackUrl, redirect = true } = signInOptions ?? {}
  if (redirect) {
    const urlToNavigateTo = callbackUrl ?? await getRequestURLWN(nuxt)
    return navigateTo(urlToNavigateTo)
  }
}

const signOut: SignOutFunc = async (signOutOptions) => {
  const nuxt = useNuxtApp()
  const runtimeConfig = await callWithNuxt(nuxt, useRuntimeConfig)
  const config = useTypedBackendConfig(runtimeConfig, 'cookie')
  const { data, rawToken, token } = await callWithNuxt(nuxt, useAuthState)

  const headers = new Headers({ [config.cookie.name]: token.value } as HeadersInit)
  data.value = null
  rawToken.value = null

  const { path, method } = config.endpoints.signOut

  const res = await _fetch(nuxt, path, { method, headers })

  const { callbackUrl, redirect = true } = signOutOptions ?? {}
  if (redirect) {
    await navigateTo(callbackUrl ?? await getRequestURLWN(nuxt))
  }

  return res
}

type UseAuthReturn = ReturnType<typeof useLocalAuth> & { csrfRequest: () => Promise<Record<string, any>> }

export const useAuth = (): UseAuthReturn => {
  const localAuth = useLocalAuth()
  // overwrite the local signIn & signOut Function
  localAuth.signIn = signIn
  localAuth.signOut = signOut

  return {
    ...localAuth,
    csrfRequest
  }
}
