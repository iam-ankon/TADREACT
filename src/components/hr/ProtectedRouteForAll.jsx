// Same guard as ProtectedRoute: pages wrapped in this component used to be
// open to any logged-in user by typing the URL, even when the user's menu
// doesn't offer them (e.g. stock report, salary records). Access now follows
// the menus - see utils/routeAccess.js.
export { default } from "./ProtectedRoute";
