import { Provider } from "./components/ui/provider";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import SubredditContextProvider from "./store/SubredditContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <SubredditContextProvider>
      <Provider>
        <App />
      </Provider>
    </SubredditContextProvider>
  </React.StrictMode>,
);
