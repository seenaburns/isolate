import React from "react";

interface Props {
  durationMs: number;
  className: string;
  enabled: boolean;
}

interface State {
  enabled: boolean;
  timeout?: NodeJS.Timeout;
}

export default class Animated extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    this.state = {
      enabled: props.enabled
    };
  }

  clearTimeout() {
    if (this.state.timeout) {
      clearTimeout(this.state.timeout);
    }
  }

  // Clear existing timeout, set enabled after delay
  setEnabledAfterDuration(enabled: boolean) {
    const timeout = setTimeout(() => {
      this.setState({
        enabled: enabled,
        timeout: null
      });
    }, this.props.durationMs);
    this.setState({
      timeout: timeout
    });
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    if (prevProps.enabled && !this.props.enabled) {
      this.clearTimeout();
      this.setEnabledAfterDuration(false);
    } else if (!prevProps.enabled && this.props.enabled) {
      this.clearTimeout();
      this.setState({
        enabled: true
      });
    }
  }

  render() {
    // if (this.state.enabled) {
    const className = this.props.enabled
      ? `${this.props.className} enabled`
      : `${this.props.className} disabled`;
    return <div className={className}>{this.props.children}</div>;
    // } else {
    //   return null;
    // }
  }
}
