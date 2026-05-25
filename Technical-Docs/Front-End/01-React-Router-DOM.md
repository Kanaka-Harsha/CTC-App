# 🧭 Learning: React Router DOM

## What is it?
`react-router-dom` is a library used in React applications to enable **Client-Side Routing**. In a traditional website, clicking a link causes the browser to request an entirely new HTML page from the server. With React Router, clicking a link simply swaps out the React components being displayed, making the app feel incredibly fast (like a native mobile app) because the page never actually reloads.

## Why did we use it in the CTC App?
We used it to build the navigation between the **Home**, **Login**, **Register**, and **Upload Evidence** pages. 
- **User Experience**: Because we want the app to feel smooth and fast, avoiding full-page reloads is essential.
- **State Preservation**: It allows us to keep certain parts of the UI constant (like the `<Header />` component) while only changing the main content in the middle.

## How the Code Works
Take a look at `App.jsx`. You will see this structure:
```jsx
<Router>
  <Header />
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/login" element={<Login />} />
    {/* ...other routes */}
  </Routes>
</Router>
```
- `<Router>`: Wraps the entire application and keeps track of the browser's URL.
- `<Routes>`: Acts like a massive `switch` statement. It looks at the current URL and decides which `<Route>` matches.
- `<Route>`: Maps a specific URL path (like `/login`) to a specific React Component (like `<Login />`).

To navigate between pages, we don't use the standard HTML `<a href="...">` tag. Instead, we use the `<Link to="...">` component (seen in `Header.jsx` and `Home.jsx`). This prevents the browser from doing a hard refresh.

## How to Learn It
1. **Official Docs**: Start with the [React Router Tutorial](https://reactrouter.com/en/main/start/tutorial). It is excellent and builds a project from scratch.
2. **Key Concepts to Master**:
   - `BrowserRouter` vs `HashRouter`
   - `Link` and `NavLink`
   - `useNavigate()` hook (for redirecting users after they click a button or submit a form)
   - `useParams()` hook (for dynamic URLs like `/incident/123`)
