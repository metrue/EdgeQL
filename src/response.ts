export class Res {
  private _headers: Headers = new Headers()
  private _status: number | undefined
  private _statusText: string | undefined
  private _body: any

  toJSON(): Response {
    this.headers.set('content-type', 'application/json')

    return new Response(JSON.stringify(this.body), {
      status: this.status ?? 200,
      statusText: this.statusText ?? '',
      headers: this.headers,
    })
  }

  toText(): Response {
    return new Response(this.body, {
      status: this.status ?? 200,
      headers: this.headers,
    })
  }

  set status(status: number | undefined) {
    this._status = status
  }

  get status() {
    return this._status
  }

  set statusText(text: string | undefined) {
    this._statusText = text
  }

  get statusText() {
    return this._statusText
  }

  get headers() {
    return this._headers
  }

  set body(body: any) {
    this._body = body
  }
  get body() {
    return this._body
  }
}
