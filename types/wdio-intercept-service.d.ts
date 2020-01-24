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

declare module WebdriverIO {
  interface Browser {
    setupInterceptor: () => void
    expectRequest: (
      method: WdioInterceptorService.HTTPMethod,
      url: string | RegExp,
      statusCode: number,
    ) => BrowserObject
    assertRequests: () => BrowserObject
    assertExpectedRequestsOnly: (inOrder?: boolean) => BrowserObject
    resetExpectations: () => BrowserObject
    getExpectations: () => WdioInterceptorService.ExpectedRequest[]
    getRequest: (index: number) => WdioInterceptorService.InterceptedRequest
    getRequests: () => WdioInterceptorService.InterceptedRequest[]
  }
}

declare module 'wdio-intercept-service' {
  export = WdioInterceptorService
}
