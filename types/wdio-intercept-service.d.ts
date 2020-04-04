declare namespace WdioInterceptorService {
  type HTTPMethod =
    | 'GET'
    | 'HEAD'
    | 'POST'
    | 'PUT'
    | 'DELETE'
    | 'CONNECT'
    | 'OPTIONS'
    | 'TRACE'
    | 'PATCH'

  interface ExpectedRequest {
    method: HTTPMethod
    url: string
    statusCode: number
  }

  interface InterceptedRequest {
    url: string
    method: HTTPMethod
    body: string | object
    headers: object
    response: {
      headers: object
      body: string | object
      statusCode: number
    }
  }
}
/**
 * Convert T to T or Promise<T> depending if `@wdio/sync` is being used or not.
 */
type AsyncSync<T> = WebdriverIO.BrowserObject extends WebDriver.Client
  ? T
  : Promise<T>

declare module WebdriverIO {
  interface Browser {
    setupInterceptor: () => AsyncSync<void>
    expectRequest: (
      method: WdioInterceptorService.HTTPMethod,
      url: string | RegExp,
      statusCode: number,
    ) => AsyncSync<BrowserObject>
    assertRequests: () => AsyncSync<BrowserObject>
    assertExpectedRequestsOnly: (inOrder?: boolean) => AsyncSync<BrowserObject>
    resetExpectations: () => AsyncSync<BrowserObject>
    getExpectations: () => AsyncSync<
      WdioInterceptorService.InterceptedRequest[]
    >
    getRequest: (
      index: number,
    ) => AsyncSync<WdioInterceptorService.InterceptedRequest>
    getRequests: () => AsyncSync<WdioInterceptorService.InterceptedRequest[]>
  }
}

declare module 'wdio-intercept-service' {
  export = WdioInterceptorService
}
