defmodule PaginatedInfiniteScrollPhoenixLiveviewWeb.ListLiveTest do
  use PaginatedInfiniteScrollPhoenixLiveviewWeb.ConnCase

  import Phoenix.LiveViewTest
  import PaginatedInfiniteScrollPhoenixLiveview.ListsFixtures

  @create_attrs %{}
  @update_attrs %{}
  @invalid_attrs %{}

  defp create_list(_) do
    list = list_fixture()
    %{list: list}
  end

  describe "Index" do
    setup [:create_list]

    test "lists all lists", %{conn: conn} do
      {:ok, _index_live, html} = live(conn, ~p"/lists")

      assert html =~ "Listing Lists"
    end

    test "saves new list", %{conn: conn} do
      {:ok, index_live, _html} = live(conn, ~p"/lists")

      assert index_live |> element("a", "New List") |> render_click() =~
               "New List"

      assert_patch(index_live, ~p"/lists/new")

      assert index_live
             |> form("#list-form", list: @invalid_attrs)
             |> render_change() =~ "can&#39;t be blank"

      assert index_live
             |> form("#list-form", list: @create_attrs)
             |> render_submit()

      assert_patch(index_live, ~p"/lists")

      html = render(index_live)
      assert html =~ "List created successfully"
    end

    test "updates list in listing", %{conn: conn, list: list} do
      {:ok, index_live, _html} = live(conn, ~p"/lists")

      assert index_live |> element("#lists-#{list.id} a", "Edit") |> render_click() =~
               "Edit List"

      assert_patch(index_live, ~p"/lists/#{list}/edit")

      assert index_live
             |> form("#list-form", list: @invalid_attrs)
             |> render_change() =~ "can&#39;t be blank"

      assert index_live
             |> form("#list-form", list: @update_attrs)
             |> render_submit()

      assert_patch(index_live, ~p"/lists")

      html = render(index_live)
      assert html =~ "List updated successfully"
    end

    test "deletes list in listing", %{conn: conn, list: list} do
      {:ok, index_live, _html} = live(conn, ~p"/lists")

      assert index_live |> element("#lists-#{list.id} a", "Delete") |> render_click()
      refute has_element?(index_live, "#lists-#{list.id}")
    end
  end

  describe "Show" do
    setup [:create_list]

    test "displays list", %{conn: conn, list: list} do
      {:ok, _show_live, html} = live(conn, ~p"/lists/#{list}")

      assert html =~ "Show List"
    end

    test "updates list within modal", %{conn: conn, list: list} do
      {:ok, show_live, _html} = live(conn, ~p"/lists/#{list}")

      assert show_live |> element("a", "Edit") |> render_click() =~
               "Edit List"

      assert_patch(show_live, ~p"/lists/#{list}/show/edit")

      assert show_live
             |> form("#list-form", list: @invalid_attrs)
             |> render_change() =~ "can&#39;t be blank"

      assert show_live
             |> form("#list-form", list: @update_attrs)
             |> render_submit()

      assert_patch(show_live, ~p"/lists/#{list}")

      html = render(show_live)
      assert html =~ "List updated successfully"
    end
  end
end
