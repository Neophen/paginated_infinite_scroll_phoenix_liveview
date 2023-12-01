export type Response<T> = {
  chunk: T[]
  next_cursor: number | null
  prev_cursor: number
  size: number
}

export type FeedItem = {
  sold: boolean
  price: string
  full_price: string
  src: string
  link: string
};
