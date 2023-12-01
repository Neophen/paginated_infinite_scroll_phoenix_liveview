import { ViewHook } from 'phoenix_live_view'
import { VirtualListComponent, getProductRowRenderer, updateProductRow } from '../components';
import type { FeedItem, Response } from '../types';

const InfiniteScroll: Partial<ViewHook> & {
  app: HTMLDivElement;
  pageSize: number;

} = {
  pageSize: 5,
  mounted() {
    if (!this.el) return;

    this.app = this.el;

    window.onbeforeunload = () => { setScrollPosition(window.scrollY); }


    this.init()
  },
  updated() {
    console.warn("updated")
  },
  destroyed() {
    console.warn("destroyed")
  },
  async init() {
    const pageParam = getSearchParam('page');
    const startPage = Number(pageParam || 0)
    const cols = getColumnCount();

    this.feed = new VirtualListComponent(this.app, {
      renderItem: getProductRowRenderer(cols),
      updateItem: updateProductRow,
      startPage: startPage,
      pageSize: this.pageSize,
      itemMargin: 16,
      load: async (start, limit) => {
        const {
          chunk,
          prev_cursor,
          next_cursor,
          size,
        } = await this.load(start * cols, limit * cols);
        let pageChunk = [[]];
        if (size > 0) {
          pageChunk = chunkArray(chunk, cols)
        }



        const currentPage = prev_cursor / cols;
        updateSearchParam('page', currentPage)
        return {
          prev_cursor: currentPage,
          next_cursor: next_cursor !== null ? next_cursor / cols : null,
          size: pageChunk.length,
          chunk: pageChunk,
        };
      },
      initLoad: async (start, limit) => {
        const cols = getColumnCount();
        const {
          chunk,
          prev_cursor,
          next_cursor,
          size,
        } = await this.load(start * cols, limit * cols);
        let pageChunk = [[]];
        if (size > 0) {
          pageChunk = chunkArray(chunk, cols)
        }

        return {
          prev_cursor: prev_cursor / cols,
          next_cursor: next_cursor !== null ? next_cursor / cols : null,
          size: pageChunk.length,
          chunk: pageChunk,
        };
      },
      afterInit: () => {
        const scrollTop = getScrollPosition();
        if (scrollTop) window.scrollTo(0, scrollTop);
      }
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
  const chunks = [] as T[][];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

const getColumnCount = () => {
  if (window.matchMedia("(min-width: 1024px)").matches) {
    return 4;
  }

  if (window.matchMedia("(min-width: 640px)").matches) {
    return 3;
  }

  return 2;
}

const getSearchParam = (key: string): string | null => {
  const url = new URL(document.URL)
  return url.searchParams.get(key)
}

const updateSearchParam = (key: string, value?: string | number | null): void => {
  const url = new URL(document.URL)

  if (value == null) {
    url.searchParams.delete(key)
  } else {
    url.searchParams.set(key, String(value))
  }

  window.history.replaceState(null, '', url.href)
}

const setScrollPosition = (position: number): void => {
  localStorage.setItem('scroll_position', `${position}`);
}

const getScrollPosition = (): number => {
  const storage = localStorage.getItem('scroll_position');
  return storage !== null ? parseInt(storage, 10) : 0
}

export default InfiniteScroll;
