import React, { Component } from "react";
import moment from 'moment';
import D3Map from './D3Map';
import './Map.scss';

class Map extends Component {

  componentDidMount() {
      D3Map.create(
        this._rootNode,
        this.props
      );
  }

  componentDidUpdate(prevProps) {
    D3Map.update(
       this._rootNode,
       this.props,
       prevProps
    );
  }

  componentWillUnmount() {
    D3Map.destroy(this._rootNode);
  }

  _setRef = (componentNode) => {
    this._rootNode = componentNode;
  }

  render() {
    return (
      <svg id="map"
        viewBox="-100 -100 200 200"
        ref={this._setRef.bind(this)} />
    );
  }
}

export default Map;
