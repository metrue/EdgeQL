type Headers = Record<string, string | string[]>

export class Res {
  public status?: number
  public message?: string
  public headers: Headers = {}
  public data?: any

  constructor(status?: number, message?: string, data?: any) {
    this.status = status
    this.message = message
    this.data = data
  }
}
