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
    setupInterceptor: () => Promise<void>
    expectRequest: (
      method: WdioInterceptorService.HTTPMethod,
      url: string | RegExp,
      statusCode: number,
    ) => Promise<BrowserObject>
    assertRequests: () => Promise<BrowserObject>
    assertExpectedRequestsOnly: (inOrder?: boolean) => Promise<BrowserObject>
    resetExpectations: () => Promise<BrowserObject>
    getExpectations: () => Promise<WdioInterceptorService.ExpectedRequest[]>
    getRequest: (index: number) => Promise<WdioInterceptorService.InterceptedRequest>
    getRequests: () => Promise<WdioInterceptorService.InterceptedRequest[]>
  }
}

declare module 'wdio-intercept-service' {
  export = WdioInterceptorService
}
