defmodule PaginatedInfiniteScrollPhoenixLiveviewWeb.ListLive.Index do
  use PaginatedInfiniteScrollPhoenixLiveviewWeb, :live_view

  @per_page 20
  @posts Enum.map(1..200, fn i ->
           %{
             id: i,
             title: "Post #{i}",
             page: div(i - 1, @per_page) + 1,
             content: "Some content #{i}"
           }
         end)
  @container_id "posts-container"

  def render(assigns) do
    ~H"""
    <div class="bg-white p-4">
      <div id="scroll-tracking" data-container-id={@container_id} phx-hook="InfiniteScrollTrack" />
      <span class="min-w-[65px] fixed right-2 bottom-2 z-50 rounded-lg bg-zinc-900 p-3 text-center text-3xl text-white opacity-80">
        <span class="text-sm">pg</span>
        <%= @page %>
      </span>
      <div
        id={@container_id}
        phx-update="stream"
        phx-viewport-top={@page > 1 && "prev-page"}
        phx-viewport-bottom={!@end_of_timeline? && "next-page"}
        phx-page-loading
        data-end={@end_of_timeline?}
        data-first-page={@page == 1}
        class="space-y-6 pb-[calc(200vh)] pt-[calc(200vh)] data-[end]:pb-0 data-[first-page]:pt-0"
      >
        <.link
          :for={{dom_id, entry} <- @streams.posts}
          id={dom_id}
          navigate={~p"/#{entry.id}"}
          data-page={entry.page}
          class="block rounded-xl border hover:bg-slate-50 p-4"
        >
          <h1 class="text-2xl font-bold"><%= entry.title %></h1>
          <p class="mt-2">
            <%= entry.content %>
          </p>
        </.link>
      </div>
      <div :if={@end_of_timeline?} class="text-3xl font-bold mt-10 text-center">
        🎉 You made it to the beginning of time 🎉
      </div>
    </div>
    """
  end

  def handle_params(params, _url, socket) do
    page_params = params["page"] || "1-1"

    [page_start, page_end] =
      page_params
      |> String.split("-")
      |> Enum.map(&String.to_integer/1)

    socket =
      socket
      |> assign(:page, page_start)
      |> assign(:page_start, page_start)
      |> assign(:page_end, page_end)
      |> assign(:container_id, @container_id)
      |> assign(:per_page, @per_page)
      |> paginate_posts(page_start)

    {:noreply, socket}
  end

  def handle_event("next-page", _params, socket) do
    {:noreply, paginate_posts(socket, socket.assigns.page + 1)}
  end

  def handle_event("prev-page", %{"_overran" => true}, socket) do
    {:noreply, paginate_posts(socket, :reset)}
  end

  def handle_event("prev-page", _, socket) do
    if socket.assigns.page > 1 do
      {:noreply, paginate_posts(socket, socket.assigns.page - 1)}
    else
      {:noreply, socket}
    end
  end

  defp paginate_posts(socket, :reset) do
    # We reset the stream, to clear all entries because of the limit property
    %{per_page: per_page} = socket.assigns
    page = 1

    posts = list_posts(offset: 0, limit: per_page)

    socket
    |> assign(end_of_timeline?: false)
    |> assign(page: page, page_start: nil, page_end: nil)
    |> stream(:posts, posts, reset: true)
  end

  defp paginate_posts(socket, new_page) when new_page >= 1 do
    %{per_page: per_page, page: cur_page} = socket.assigns

    posts = list_posts(offset: (new_page - 1) * per_page, limit: get_limit(socket.assigns))

    {posts, at, limit} =
      if new_page >= cur_page do
        {posts, -1, per_page * 3 * -1}
      else
        {Enum.reverse(posts), 0, per_page * 3}
      end

    case posts do
      [] ->
        socket
        |> assign(end_of_timeline?: at == -1)
        |> assign(page_start: nil, page_end: nil)
        |> stream(:posts, [])

      [_ | _] ->
        socket
        |> assign(end_of_timeline?: false)
        |> assign(page_start: nil, page_end: nil)
        |> assign(page: new_page)
        |> stream(:posts, posts, at: at, limit: limit)
    end
  end

  defp get_limit(%{page_start: nil, page_end: nil, per_page: per_page}), do: per_page

  defp get_limit(%{page_start: page_start, page_end: page_end, per_page: per_page}),
    do: (page_end - page_start + 1) * per_page

  defp list_posts(opts) do
    offset = opts[:offset] || 0
    limit = opts[:limit] || @per_page

    @posts
    |> Enum.slice(offset, limit)
  end
end
