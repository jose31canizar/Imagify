import React, { Component } from "react";
import SocketIO from "socket.io-client";
import pathParse from "path-parse";

let imageStyle = { height: "50px" };
let groupStyle = {
  display: "flex",
  boxShadow: "0 0 5px 1px #9e9e9e5c",
  padding: "4rem",
  margin: "10px",
  transition: "0.5s all"
};

let PORT = 9004;

const BucketImage = ({ name }) => (
  <div>
    <img
      style={imageStyle}
      src={`https://s3.amazonaws.com/picapoint-imagify/${name}`}
      alt={name}
    />
    <p>{name}</p>
  </div>
);

class App extends Component {
  constructor(props) {
    super(props);
    const socket = SocketIO(`http://localhost:${PORT}`);
    this.state = {
      socket,
      messages: new Set(),
      startMessage: "Waiting for messages from SQS..."
    };
  }
  componentDidMount() {
    this.state.socket.on("message", message =>
      this.setState((prev, props) => ({
        messages: prev.messages.has(message)
          ? prev.messages
          : prev.messages.add(message)
      }))
    );
  }
  render() {
    const { messages, startMessage } = this.state;

    let groups = [];

    let arrMessages = [...messages];

    let sortedMessages = arrMessages.reduce((acc, item) => {
      let { name } = pathParse(item);
      let prefix = name.substring(0, name.length - 2);
      if (acc[prefix] && !acc[prefix].includes(item)) {
        return { ...acc, [prefix]: [...acc[prefix], item] };
      } else if (acc[prefix]) {
        return { ...acc, [prefix]: [...acc[prefix]] };
      } else {
        return { ...acc, [prefix]: [item] };
      }
    }, {});

    return (
      <div>
        <h1>Imagify</h1>
        {messages.size !== 0 ? (
          Object.entries(sortedMessages).map((group, i) => (
            <div className="group" style={groupStyle}>
              {group[1].map((m, j) => (
                <BucketImage key={i + j} name={m} />
              ))}
            </div>
          ))
        ) : (
          <p>{startMessage}</p>
        )}
      </div>
    );
  }
}

export default App;
