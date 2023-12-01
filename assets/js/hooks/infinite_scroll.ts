import { ViewHook } from 'phoenix_live_view'
import { VirtualListComponent, renderProductRow, updateProductRow } from '../components';
import type { FeedItem, Response } from '../types';

const InfiniteScroll: Partial<ViewHook> & {
  app: HTMLDivElement;
  // feed: VirtualListComponent<FeedRow>;
} = {
  mounted() {
    if (!this.el) return;

    this.load(0, 10)

    this.app = this.el;
    console.log("mounted")
    this.init()
  },
  updated() {
    console.log("updated")
  },
  destroyed() {
    console.log("destroyed")
  },
  async init() {
    this.feed = new VirtualListComponent(this.app, {
      templateFn: renderProductRow,
      updateFn: updateProductRow,
      pageSize: 5,
      itemMargin: 16,
      load: async (start, limit) => {
        const cols = getColumnCount();
        const response = await this.load(start * cols, limit * cols);
        let page_chunk = [[]];
        if (response.size > 0) {
          page_chunk = chunkArray(response.chunk, cols)
        }

        return {
          ...response,
          chunk: page_chunk,
        };
      },
    });

    this.feed.render();
  },
  async load(start: number, limit: number): Promise<Response<FeedItem>> {
    return new Promise<Response<FeedItem>>((resolve, reject) => {
      this.pushEvent("load", { start, limit }, (reply: Response<FeedItem>, ref) => {
        resolve(reply)
      })
    })
  }
};

function chunkArray<T>(array: Array<T>, chunkSize: number): T[][] {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

const getColumnCount = () => {
  if (window.matchMedia("(min-width: 1024px)")) {
    return 4;
  }

  if (window.matchMedia("(min-width: 640px)")) {
    return 3;
  }

  return 2;
}

export default InfiniteScroll;
