export function sendAll<T>(data: T[]) {
  return {
    data: data,
  }
}

export function sendOne<T>(data: T) {
  return {
    data: data,
  }
}

export function sendError(message: string) {
  return {
    error: {
      message,
    },
  }
}
