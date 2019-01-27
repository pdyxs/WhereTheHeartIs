import React from "react";
import { render } from "react-dom";
import { Provider } from "react-redux";
import App from "../js/components/App";
import { Router, Route } from 'react-router-dom';
import { createBrowserHistory, createHashHistory } from 'history';
import store from './store';

var history = null;
if (PLATFORM == PLATFORM_MOBILE)
{
  history = createHashHistory();
} else {
  history = createBrowserHistory();
}

render(
  <Provider store={store}>
    <Router history={history}>
      <Route path="/" component={App} />
    </Router>
  </Provider>,
  document.getElementById("app")
);
