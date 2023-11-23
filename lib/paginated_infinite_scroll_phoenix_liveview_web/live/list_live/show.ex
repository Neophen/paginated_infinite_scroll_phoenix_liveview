defmodule PaginatedInfiniteScrollPhoenixLiveviewWeb.ListLive.Show do
  use PaginatedInfiniteScrollPhoenixLiveviewWeb, :live_view

  @posts Enum.map(1..200, fn i ->
           %{
             id: i,
             title: "Post #{i}",
             content: "Some content #{i}"
           }
         end)

  def mount(params, _session, socket) do
    id = String.to_integer(params["id"] || "1")

    post = Enum.slice(@posts, id - 1, 1) |> List.first()

    socket =
      socket
      |> assign(:post, post)

    {:ok, socket}
  end

  def render(assigns) do
    ~H"""
    <div class="mt-4 space-y-4 bg-white p-8 rounded-2xl">
      <div class="flex gap-4">
        <.button onclick="window.history.go(-1); return false;">Back</.button>
        <h1 class="text-4xl text-rose-600 font-bold"><%= @post.title %></h1>
      </div>

      <p><%= @post.content %></p>
    </div>
    """
  end
end
